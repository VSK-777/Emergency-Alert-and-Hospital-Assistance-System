# Workspace Rules — Emergency Alert and Hospital Assistance System

## Git Synchronization Invariant
- **Always Commit and Push Changes**: Whenever you make any changes to the codebase, configurations, tests, or documentation—even if it is a single-line or minor change—you MUST always stage the files (`git add`), commit them with a descriptive conventional commit message (`git commit`), and push immediately to `origin/main` (`git push origin main`).
- **Continuous Deployment Alignment**: Ensure changes are pushed so that live cloud deployments (Vercel frontend and Render backend) remain continuously synchronized with the repository.
- **Verify Clean State**: At the conclusion of any task, verify that `git status` shows a clean working tree and that local `main` is up-to-date with `origin/main`.
- **Repository Scope Preservation**: Ensure that only `Backend/` and `Web App/` are tracked in the GitHub repository, keeping local-only directories (`Mobile App/`, `Smart Watch App/`) untracked.
