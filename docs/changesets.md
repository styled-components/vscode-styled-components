# Changesets and the release pipeline

Checked 2026-11-18 against @changesets/cli 3.0.3, @changesets/config 4.0.1, changesets/action v2.1.2, @vscode/vsce 4.1.

## How a release happens

- A PR with a user-facing change adds a changeset (`npx changeset`). On merge to `main`, `release.yml` runs changesets/action: with pending changesets it opens or updates the "Version Packages" PR (version bump and `CHANGELOG.md`).
- Merging the Version Packages PR leaves no pending changesets, so the next run calls `npm run release`. That script skips when the GitHub release `v<version>` already exists, otherwise runs `vsce publish --oidc --skip-duplicate` and then `changeset publish`.
- The package is `private: true` (it never goes to npm). `.changeset/config.json` sets `privatePackages: { "version": true, "tag": true }`, so `changeset publish` only creates the `v<version>` tag, and the action creates the GitHub release from it.
- A push with nothing to release (CI or docs changes) takes the publish path and stops at the existing-release check.

## Rules and traps

- CLI and action move together: @changesets/cli 3.x needs changesets/action v2 (it throws at startup on a CLI 2 range), and v2 inputs are kebab-case (`publish-script`, `github-token`). Bumping only one passes PR CI and fails the first release run on `main`.
- Pin the config `$schema` to the installed `@changesets/config` major.minor (4.0.x for CLI 3). The 3.1.x schema belongs to CLI 2 and still loads, so a stale pin validates against the wrong schema without complaint.
- Never hand-edit `version` in `package.json` or `CHANGELOG.md`; the Version Packages PR owns both.
- A changeset body uses no markdown headings (changesets nests it under its own `### Patch Changes`); use bold labels.
- A malformed changeset (no closing `---` fence, or a bump that is not `"vscode-styled-components": patch|minor|major`) passes PR CI, because the changeset is markdown, and then blocks the release on `main`.
- `changeset publish` has no `--dry-run`; test the publish path by running the release script with credentials removed, never by hoping it stops in time.
