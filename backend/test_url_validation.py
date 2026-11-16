from app import AnalysisError, parse_github_repo_url


def expect_error(url):
    try:
        parse_github_repo_url(url)
    except AnalysisError:
        return True
    return False


def main():
    owner, repo, clone_url = parse_github_repo_url("https://github.com/psf/requests")
    assert owner == "psf"
    assert repo == "requests"
    assert clone_url == "https://github.com/psf/requests.git"

    owner, repo, clone_url = parse_github_repo_url("https://github.com/psf/requests.git/")
    assert owner == "psf" and repo == "requests"

    failures = [
        "https://example.com/not-a-repo",
        "https://github.com/owner",
        "https://github.com/owner/repo/tree/main",
        "https://github.com/owner/repo?tab=readme",
        "https://github.com/owner/repo#frag",
        "https://user:pass@github.com/owner/repo",
        "http://github.com/owner/repo",
        "https://github.com.evil.com/owner/repo",
        "https://github.com/../repo",
        "not a url",
        "",
    ]
    for url in failures:
        assert expect_error(url), f"should reject {url!r}"

    print("url validation ok")


if __name__ == "__main__":
    main()
