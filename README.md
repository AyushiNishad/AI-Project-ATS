# AI Project ATS – GitHub Repository Analyzer

An intelligent Python GitHub Repository Analyzer that analyzes code quality, complexity, security, documentation, and testing of Python repositories.

## Features
- Analyze public GitHub repositories
- Code complexity analysis using Radon
- Security analysis using Bandit
- Documentation and testing evaluation
- Generate an overall project score
- Save and view previous analysis reports
- Interactive dashboard for analysis results

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Python, Flask
- **Database:** SQLite, SQLAlchemy
- **Analysis Tools:** Radon, Bandit, Python AST

## Scoring System
- Code Complexity: 35%
- Security: 35%
- Documentation: 15%
- Testing: 15%

## Installation

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
npm install
npm run dev
```

## Project Purpose
This project helps developers evaluate Python GitHub repositories and understand code quality through automated analysis and reports.

## Current Limitations
- Supports eligible Python files only.
- AI Logic analysis is not currently implemented.

## Author
Developed as a College Project.
