from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from pathlib import Path

db = SQLAlchemy()

class AnalysisReport(db.Model):
    __tablename__ = "analysis_reports"

    id = db.Column(db.Integer, primary_key=True)
    repository = db.Column(db.String(255), nullable=False)
    repo_url = db.Column(db.String(500), nullable=False)
    branch = db.Column(db.String(100))
    overall_score = db.Column(db.Float)
    report_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)