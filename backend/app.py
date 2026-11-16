import ast
import logging
import os
import re
import shutil
import stat
import subprocess
import tempfile
import json
from pathlib import Path
from database import db, AnalysisReport
from pathlib import Path
from urllib.parse import urlparse
from flask import Flask, jsonify, request
from flask_cors import CORS



app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = (

    "sqlite:///" + str(Path(__file__).resolve().parent / "analysis.db")

)



app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False



db.init_app(app)



with app.app_context():

    db.create_all()



CORS(app)



# Resource limits are configurable so a large public clone cannot exhaust the machine.

CLONE_TIMEOUT_SECONDS = int(os.environ.get("ANALYZE_CLONE_TIMEOUT", "90"))

MAX_FILES = int(os.environ.get("ANALYZE_MAX_FILES", "100"))

MAX_FILE_BYTES = int(os.environ.get("ANALYZE_MAX_FILE_BYTES", "200000"))

MAX_TOTAL_BYTES = int(os.environ.get("ANALYZE_MAX_TOTAL_BYTES", "8000000"))



OWNER_RE = re.compile(r"^[A-Za-z0-9_.-]{1,39}$")

REPO_RE = re.compile(r"^[A-Za-z0-9_.-]{1,100}$")



SKIP_DIR_NAMES = {

    ".git",

    ".hg",

    ".svn",

    ".venv",

    "venv",

    "env",

    "virtualenv",

    "node_modules",

    "__pycache__",

    "dist",

    "build",

    ".tox",

    ".mypy_cache",

    ".pytest_cache",

    ".ruff_cache",

    ".eggs",

    "eggs",

    "site-packages",

    "vendor",

    ".cache",

    "coverage",

    "htmlcov",

    ".idea",

    ".vscode",

}



TEST_CONFIG_NAMES = {

    "pytest.ini",

    "tox.ini",

    "noxfile.py",

    ".coveragerc",

    "conftest.py",

    "unittest.cfg",

}



README_NAMES = {

    "readme",

    "readme.md",

    "readme.rst",

    "readme.txt",

    "readme.adoc",

}





class AnalysisError(Exception):

    """User-facing analysis failure with an HTTP status code."""



    def __init__(self, message, status_code=400):

        super().__init__(message)

        self.status_code = status_code





def clamp_score(value):

    return int(max(0, min(100, round(value))))





def safe_relpath(path, root):

    """Return a repo-relative POSIX path. Never expose the host temp directory."""

    relative = Path(path).resolve().relative_to(Path(root).resolve())

    return relative.as_posix()





def parse_github_repo_url(repo_url):

    """Accept only https://github.com/owner/repo with an optional .git suffix."""

    if not isinstance(repo_url, str) or not repo_url.strip():

        raise AnalysisError(

            "Enter a valid public GitHub URL, for example https://github.com/owner/repo.",

            400,

        )



    raw = repo_url.strip()

    parsed = urlparse(raw)



    if parsed.scheme.lower() != "https":

        raise AnalysisError(

            "Only HTTPS GitHub URLs are supported, for example https://github.com/owner/repo.",

            400,

        )



    if parsed.username or parsed.password:

        raise AnalysisError(

            "Repository URLs must not include usernames, passwords, or tokens.",

            400,

        )



    if parsed.port is not None:

        raise AnalysisError("Repository URLs must not include a custom port.", 400)



    host = (parsed.hostname or "").lower()

    if host != "github.com":

        raise AnalysisError(

            "Only public github.com repositories are supported. "

            "Other hosts, mirrors, and git servers are rejected.",

            400,

        )



    if parsed.query or parsed.fragment:

        raise AnalysisError(

            "Repository URLs must not include query strings or fragments.",

            400,

        )



    parts = [part for part in parsed.path.split("/") if part]

    if len(parts) != 2:

        raise AnalysisError(

            "Use a repository root URL such as https://github.com/owner/repo. "

            "Extra paths like /tree/main or /blob/... are not accepted.",

            400,

        )



    owner, repo = parts

    if repo.lower().endswith(".git"):

        repo = repo[:-4]



    if not OWNER_RE.fullmatch(owner) or not REPO_RE.fullmatch(repo):

        raise AnalysisError(

            "The GitHub owner or repository name is not valid.",

            400,

        )



    if owner in {".", ".."} or repo in {".", ".."}:

        raise AnalysisError("The GitHub owner or repository name is not valid.", 400)



    # Rebuild the clone URL so Git never receives an unsanitized user string.

    clone_url = f"https://github.com/{owner}/{repo}.git"

    return owner, repo, clone_url





def ensure_git_available():

    git_path = shutil.which("git")

    if not git_path:

        raise AnalysisError(

            "Git is not installed or is not on PATH. Install Git for Windows "

            "and confirm `git --version` works, then retry.",

            503,

        )

    return git_path





def force_remove(func, path, _exc_info):

    """Windows clones often mark .git files read-only; unlock them during cleanup."""

    try:

        os.chmod(path, stat.S_IWRITE)

        func(path)

    except OSError:

        pass





def remove_tree(path):

    if path and os.path.exists(path):

        shutil.rmtree(path, onerror=force_remove)





def clone_repository(clone_url, destination):

    git_path = ensure_git_available()

    env = os.environ.copy()

    env["GIT_TERMINAL_PROMPT"] = "0"

    env["GCM_INTERACTIVE"] = "never"



    command = [

        git_path,

        "-c", "credential.helper=",

        "-c", "core.askPass=",

        "clone",

        "--depth", "1",

        "--single-branch",

        "--no-tags",

        clone_url,

        destination,

    ]



    try:

        completed = subprocess.run(

            command,

            check=False,

            capture_output=True,

            text=True,

            timeout=CLONE_TIMEOUT_SECONDS,

            env=env,

        )

    except subprocess.TimeoutExpired as exc:

        raise AnalysisError(

            f"Cloning the repository timed out after {CLONE_TIMEOUT_SECONDS} seconds. "

            "Try a smaller repository, or increase ANALYZE_CLONE_TIMEOUT.",

            504,

        ) from exc

    except OSError as exc:

        raise AnalysisError(

            "Git could not be started. Confirm Git is installed and on PATH.",

            503,

        ) from exc



    if completed.returncode != 0:

        stderr = (completed.stderr or "").lower()

        if "not found" in stderr or "repository not found" in stderr:

            raise AnalysisError(

                "The repository could not be cloned. Confirm the URL is correct "

                "and that the repository is public.",

                404,

            )

        if "authentication" in stderr or "permission" in stderr or "denied" in stderr:

            raise AnalysisError(

                "The repository could not be cloned. Private repositories are not supported.",

                404,

            )

        raise AnalysisError(

            "The public repository could not be cloned. Check the URL, your network, "

            "and that Git hosting is reachable. This is not a GitHub REST API rate limit.",

            502,

        )





def detect_branch(repo_dir):

    git_path = shutil.which("git")

    if not git_path:

        return "unknown"



    try:

        completed = subprocess.run(

            [git_path, "-C", repo_dir, "rev-parse", "--abbrev-ref", "HEAD"],

            check=False,

            capture_output=True,

            text=True,

            timeout=10,

        )

    except (OSError, subprocess.TimeoutExpired):

        return "unknown"



    branch = (completed.stdout or "").strip()

    if completed.returncode != 0 or not branch or branch == "HEAD":

        return "unknown"

    return branch





def is_probably_binary(sample):

    return b"\x00" in sample





def looks_like_test_path(relative_path):

    posix = relative_path.lower()

    name = Path(posix).name.lower()

    parts = Path(posix).parts

    if any(part in {"tests", "test", "testing"} for part in parts):

        return True

    if name.startswith("test_") or name.endswith("_test.py") or name == "conftest.py":

        return True

    return False





def collect_repository_signals(repo_dir):

    python_candidates = []

    readme_found = False

    tests_found = False

    test_config_found = False

    ci_found = False

    skipped_large_files = 0

    bytes_budget = 0



    root = Path(repo_dir)



    for current_root, dirnames, filenames in os.walk(root):

        dirnames[:] = [

            name for name in dirnames

            if name.lower() not in SKIP_DIR_NAMES

        ]



        current = Path(current_root)

        for filename in filenames:

            full_path = current / filename

            relative = safe_relpath(full_path, root)

            lower_name = filename.lower()



            if lower_name in README_NAMES:

                readme_found = True



            if lower_name in TEST_CONFIG_NAMES:

                test_config_found = True

                tests_found = True



            if "pyproject.toml" == lower_name or "setup.cfg" == lower_name:

                test_config_found = True



            parts = Path(relative).parts

            if ".github" in parts and "workflows" in parts and lower_name.endswith((".yml", ".yaml")):

                ci_found = True



            if looks_like_test_path(relative):

                tests_found = True



            if full_path.suffix.lower() != ".py":

                continue



            try:

                size = full_path.stat().st_size

            except OSError:

                continue



            if size > MAX_FILE_BYTES:

                skipped_large_files += 1

                continue



            if bytes_budget + size > MAX_TOTAL_BYTES:

                skipped_large_files += 1

                continue



            if len(python_candidates) >= MAX_FILES:

                skipped_large_files += 1

                continue



            python_candidates.append((full_path, relative, size))

            bytes_budget += size



    return {

        "python_candidates": python_candidates,

        "readme_found": readme_found,

        "tests_found": tests_found,

        "test_config_found": test_config_found,

        "ci_found": ci_found,

        "skipped_large_files": skipped_large_files,

        "bytes_read": bytes_budget,

    }





def analyze_python_source(source):

    result = {

        "lines": len(source.splitlines()),

        "functions": 0,

        "complexity": [],

        "maintainability_index": None,

    }



    try:

        tree = ast.parse(source)

        result["functions"] = sum(

            isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))

            for node in ast.walk(tree)

        )

    except SyntaxError:

        return result



    try:

        from radon.complexity import cc_visit

        from radon.metrics import mi_visit



        blocks = cc_visit(source)

        result["complexity"] = [

            {

                "name": block.name,

                "line": block.lineno,

                "score": block.complexity,

            }

            for block in blocks

        ]

        result["maintainability_index"] = round(mi_visit(source, multi=True), 2)

    except Exception:

        # Keep file-level counts if Radon cannot parse an individual file.

        pass



    return result





def run_bandit(file_paths, repo_dir):

    """Run Bandit on selected Python files. Findings are static indicators, not confirmed vulns."""

    issues = []

    if not file_paths:

        return issues



    try:

        from bandit.core import config as bandit_config

        from bandit.core import manager as bandit_manager

    except ImportError as exc:

        raise AnalysisError(

            "The Bandit security scanner is not installed in the backend environment. "

            "Install dependencies from requirements.txt.",

            500,

        ) from exc



    try:

        config = bandit_config.BanditConfig()

        manager = bandit_manager.BanditManager(config, "file", False)

        manager.discover_files([str(path) for path in file_paths])

        manager.run_tests()



        for issue in manager.get_issue_list():

            try:

                relative = safe_relpath(issue.fname, repo_dir)

            except ValueError:

                relative = Path(issue.fname).name



            issues.append({

                "file": relative,

                "severity": str(issue.severity).lower(),

                "confidence": str(issue.confidence).lower(),

                "test_id": issue.test_id,

                "message": issue.text,

                "line": issue.lineno,

            })

    except AnalysisError:

        raise

    except Exception:

        app.logger.exception("Bandit failed; continuing without security findings")



    return issues





def score_complexity(all_complexities):

    if not all_complexities:

        return 100

    penalty = sum(max(0, complexity - 5) * 4 for complexity in all_complexities)

    return clamp_score(100 - penalty)





def score_security(security_issues):

    high = sum(issue["severity"] == "high" for issue in security_issues)

    medium = sum(issue["severity"] == "medium" for issue in security_issues)

    low = sum(issue["severity"] == "low" for issue in security_issues)

    return clamp_score(100 - high * 20 - medium * 10 - low * 3)





def score_documentation(readme_found):

    return 100 if readme_found else 0





def score_testing(tests_found, test_config_found, ci_found):

    if not tests_found and not test_config_found and not ci_found:

        return 0

    value = 0

    if tests_found:

        value += 70

    if test_config_found:

        value += 20

    if ci_found:

        value += 10

    return clamp_score(value)





def analyze_cloned_repo(repo_dir, owner, repo):

    signals = collect_repository_signals(repo_dir)

    analyzed_files = []

    python_paths = []



    for full_path, relative, size in signals["python_candidates"]:

        try:

            with open(full_path, "rb") as handle:

                raw = handle.read(size)

        except OSError:

            continue



        if is_probably_binary(raw):

            continue



        source = raw.decode("utf-8", errors="replace")

        metrics = analyze_python_source(source)

        analyzed_files.append({"path": relative, **metrics})

        python_paths.append(full_path)



    if not analyzed_files:

        raise AnalysisError(

            "This repository has no analyzable Python files after skipping "

            "generated folders, binaries, and files over the size limit.",

            422,

        )



    all_complexities = [

        entry["score"]

        for file in analyzed_files

        for entry in file["complexity"]

    ]



    security_issues = run_bandit(python_paths, repo_dir)



    complexity_score = score_complexity(all_complexities)

    security_score = score_security(security_issues)

    documentation_score = score_documentation(signals["readme_found"])

    testing_score = score_testing(

        signals["tests_found"],

        signals["test_config_found"],

        signals["ci_found"],

    )



    overall_score = clamp_score(

        complexity_score * 0.35

        + security_score * 0.35

        + documentation_score * 0.15

        + testing_score * 0.15

    )



    limitations = [

        "Only Python files were analyzed.",

        "Scores are heuristic static-analysis indicators, not a guarantee that code is safe or high quality.",

        "Bandit findings may include false positives and are not confirmed vulnerabilities.",

        "AI Logic & Edge Cases was not analyzed; this backend does not inspect model prompts or AI behavior.",

        "A shallow git clone is used instead of the GitHub REST API. Git hosting, network, and local resource limits can still apply.",

        f"At most {MAX_FILES} Python files, {MAX_FILE_BYTES} bytes per file, and {MAX_TOTAL_BYTES} total bytes are inspected.",

    ]

    if signals["skipped_large_files"]:

        limitations.append(

            f"{signals['skipped_large_files']} extra Python files were skipped because of size or count limits."

        )



    return {

        "repository": f"{owner}/{repo}",

        "branch": detect_branch(repo_dir),

        "overall_score": overall_score,

        "scores": {

            "complexity": complexity_score,

            "security": security_score,

            "documentation": documentation_score,

            "testing": testing_score,

        },

        "summary": {

            "python_files_analyzed": len(analyzed_files),

            "total_lines": sum(file["lines"] for file in analyzed_files),

            "functions": sum(file["functions"] for file in analyzed_files),

            "security_issues": len(security_issues),

            "readme_found": signals["readme_found"],

            "tests_found": signals["tests_found"],

        },

        "security_issues": security_issues,

        "limitations": limitations,

    }





@app.route("/", methods=["GET"])

def home():

    return jsonify({

        "status": "success",

        "message": "Backend is running",

        "health": "/api/health"

    })





@app.route("/api/history", methods=["GET"])
def get_analysis_history():
    try:
        reports = AnalysisReport.query.order_by(
            AnalysisReport.created_at.desc()
        ).all()

        history = []
        for report in reports:
            history.append({
                "id": report.id,
                "repository": report.repository,
                "repo_url": report.repo_url,
                "branch": report.branch,
                "overall_score": report.overall_score,
                "created_at": (
                    report.created_at.isoformat()
                    if report.created_at else None
                ),
                "report": json.loads(report.report_json),
            })

        return jsonify({
            "status": "success",
            "reports": history,
        }), 200

    except Exception:
        db.session.rollback()
        app.logger.exception("Could not fetch analysis history")
        return jsonify({
            "status": "error",
            "error": "Could not fetch analysis history",
        }), 500


@app.route("/api/analyze", methods=["POST"])

def analyze_repository():

    body = request.get_json(silent=True) or {}

    repo_url = body.get("repo_url", "")



    try:

        owner, repo, clone_url = parse_github_repo_url(repo_url)

    except AnalysisError as exc:

        return jsonify({"error": str(exc)}), exc.status_code



    temp_dir = tempfile.mkdtemp(prefix="ats-clone-")

    clone_dest = os.path.join(temp_dir, "repo")



    try:

        clone_repository(clone_url, clone_dest)



        if not os.path.isdir(clone_dest) or not os.listdir(clone_dest):

            raise AnalysisError(

                "The repository cloned successfully but appears empty.",

                422,

            )



        payload = analyze_cloned_repo(clone_dest, owner, repo)



        # Save the analysis report in SQLite

        report = AnalysisReport(

            repository=str(payload.get("repository") or f"{owner}/{repo}"),

            repo_url=repo_url,

            branch=payload.get("branch"),

            overall_score=payload.get("overall_score"),

            report_json=json.dumps(payload)

        )



        db.session.add(report)

        db.session.commit()



        # Return the original response to the frontend

        return jsonify(payload)



    except AnalysisError as exc:

        db.session.rollback()

        return jsonify({"error": str(exc)}), exc.status_code



    except Exception:

        db.session.rollback()

        app.logger.exception("Unexpected repository analysis error")



        return jsonify({

            "error": "An unexpected server error occurred while analyzing the repository."

        }), 500



    finally:

        remove_tree(temp_dir)





if __name__ == "__main__":

    logging.basicConfig(level=logging.INFO)



    # Local development only. Do not expose Flask's debug server publicly.

    app.run(host="127.0.0.1", port=5000, debug=True)


