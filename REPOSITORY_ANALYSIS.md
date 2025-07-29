# Repository Structure Analysis - LocumTrueRate Project

## Summary

After thorough analysis, here's what I found about your repository structure:

### Two Git Repositories Exist:

1. **Parent Repository** (`/home/Mike/`)
   - Currently on branch: `staging-deploy`
   - Last commit: July 26, 2025 (Day 11 API integration)
   - Has 116 uncommitted changes
   - Contains the original full project structure

2. **Subdirectory Repository** (`/home/Mike/projects/jobboard/`)
   - Currently on branch: `vanilla-only`
   - Last commit: July 28, 2025 (Paycheck calculator QA fixes)
   - This is the **ACTIVELY DEPLOYED** repository
   - Created on July 24, 2025

## Timeline of Events

1. **July 24, 2025**: 
   - A "backup commit before directory reorganization" was made in the parent repo
   - The `/home/Mike/projects/jobboard` subdirectory was created as a new repository
   - This new repo was set up specifically for vanilla demos deployment

2. **July 24-26, 2025**: 
   - Parent repo continued development (API integration, Day 11 features)
   - These changes were NOT deployed

3. **July 28, 2025 (Today)**:
   - All recent deployments to Heroku staging are from the `jobboard` subdirectory
   - Latest deployment: v250 (commit 6ffab5b) - "Fix: Paycheck calculator QA issues"

## Current Deployment Status

### Active Deployment Source: `/home/Mike/projects/jobboard/`
- This is what's running on `locumtruerate-staging`
- Contains vanilla HTML demos with Node.js server
- Has its own `package.json`, `Procfile`, and complete structure
- Recent commits show QA fixes for various dashboards

### Parent Repository Status:
- Contains more recent feature development (Day 11 API integration)
- Has 116 uncommitted changes including:
  - Deleted core files (package.json, Procfile, README.md)
  - Modified API and frontend files
  - New files in projects/jobboard subdirectory
- These changes have NOT been deployed

## Key Findings

1. **Deployment Confusion**: You have two separate Git repositories with the same remotes
2. **Active Development Split**: 
   - Deployment fixes → `jobboard` subdirectory
   - Feature development → Parent repository
3. **Uncommitted Changes**: The parent repo has significant uncommitted changes that may represent lost work

## Heroku Apps Found

- locumtruerate-staging (actively receiving deployments from jobboard)
- locumtruerate-demo
- locumtruerate-production
- locumtruerate-vanilla-prod
- And several others...

## Recommendations

1. **Immediate Action**: The parent repository has 116 uncommitted changes that should be reviewed and either committed or discarded
2. **Repository Consolidation**: Consider merging the work from both repositories to avoid confusion
3. **Clear Deployment Path**: Establish which repository should be the source of truth for deployments

The current active deployment source is `/home/Mike/projects/jobboard/`, and all recent Heroku deployments are coming from this repository's `vanilla-only` branch.