# GitHub Actions baseline

Checked 2026-11-18 against actions/checkout v7.0.1, actions/setup-node v7.1.0, actions/upload-artifact v7.0.2, changesets/action v2.1.2, zizmor 1.32 (zizmor-action v0.8.1). The "Workflow Security" CI job (`.github/workflows/zizmor.yml`) enforces most of this with zizmor on every `.github/` change.

## Every workflow

- Workflow-level `permissions` is `contents: read` or `{}`; a job that needs more declares it on the job.
- Every job sets `timeout-minutes` well above its slowest honest run (the default is 6 hours).
- `actions/checkout` sets `persist-credentials: false`, so the token never lands in `.git/config` where later steps can read it. changesets/action v2 pushes the version branch through the API, so the release job needs no persisted credentials either.
- Every `uses:` is pinned to a full commit SHA with a `# vX.Y.Z` comment. This repo pins first-party `actions/*` by SHA too. Dependabot (`.github/dependabot.yml`, with a 7-day cooldown) keeps the pins current. Pin to the peeled commit (`git ls-remote <repo> 'refs/tags/vX.Y.Z^{}'` when the tag is annotated), never the tag object.
- PR-triggered workflows cancel superseded runs with a concurrency group keyed on the PR number.
- No `pull_request_target`, and no `${{ }}` expression of untrusted input (PR titles, branch names, issue bodies) inside a `run:` script; pass it through `env:`.

## Release job

- Publishing uses VS Code Marketplace trusted publishing: `id-token: write` plus `vsce publish --oidc`, no stored token. Never reintroduce a long-lived publish secret.
- No dependency cache in the release job (`package-manager-cache: false`, no `cache:` input, no `actions/cache`). A poisoned cache entry would run with the publish identity; the cold install is the accepted cost.
- A manual run on a ref other than `main` fails at its first step. That guards against a mistaken dispatch only: a branch can edit the workflow itself, so the Marketplace trusted-publisher binding is the real control.
- Events created with the job's `GITHUB_TOKEN` (the version PR) start no workflows, so required checks never run on that PR. Setting a `RELEASE_GITHUB_TOKEN` secret (a PAT or GitHub App token) fixes this; `release.yml` already prefers it.

## Repository settings this baseline assumes

- The default workflow token permission is read-only.
- "Allow GitHub Actions to create and approve pull requests" stays on while the version PR is opened with `GITHUB_TOKEN`; it can be turned off once `RELEASE_GITHUB_TOKEN` exists.
