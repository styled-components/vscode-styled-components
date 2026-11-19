# Changesets and the release pipeline

Checked 2026-11-18 against @changesets/cli 3.0.3, @changesets/config 4.0.1, changesets/action v2.1.2, @vscode/vsce 4.1.

## How a release happens

- A PR with a user-facing change adds a changeset (`npx changeset`). On merge to `main`, `release.yml` runs changesets/action: with pending changesets it opens or updates the version PR (version bump and `CHANGELOG.md`).
- Merging the version PR ("chore: version packages", set by the action's `pr-title` and `commit-message` inputs) leaves no pending changesets, so the next run calls `npm run release`. That script skips when the GitHub release `v<version>` already exists, otherwise runs `vsce publish --oidc --skip-duplicate` and then `changeset publish`.
- The package is `private: true` (it never goes to npm). `.changeset/config.json` sets `privatePackages: { "version": true, "tag": true }`, so `changeset publish` only creates the `v<version>` tag, and the action creates the GitHub release from it.
- A push with nothing to release (CI or docs changes) takes the publish path and stops at the existing-release check.

## Writing a changeset

One file per user-noticeable change, named `.changeset/<kebab-case-name>.md`:

```md
---
"vscode-styled-components": patch
---

Highlighting no longer spills out of a styled template when its tag spans several lines.
```

- The bump is `patch` for a fix or a speedup, `minor` for new behavior, and `major` for a change to the public contract (docs/spec.md, "Public contract").
- The body is one short paragraph for users of the extension; its writing rules are in AGENTS.md, "Prose and communication".
- `npx changeset` writes the same file interactively.

## Rules and traps

- CLI and action move together: @changesets/cli 3.x needs changesets/action v2 (it throws at startup on a CLI 2 range), and v2 inputs are kebab-case (`publish-script`, `github-token`). Bumping only one passes PR CI and fails the first release run on `main`.
- Pin the config `$schema` to the installed `@changesets/config` major.minor (4.0.x for CLI 3). The 3.1.x schema belongs to CLI 2 and still loads, so a stale pin validates against the wrong schema without complaint.
- Never hand-edit `version` in `package.json` or `CHANGELOG.md`; the version PR owns both.
- A changeset body uses no markdown headings (changesets nests it under its own `### Patch Changes`); use bold labels.
- A malformed changeset (no closing `---` fence, or a bump that is not `"vscode-styled-components": patch|minor|major`) passes PR CI, because the changeset is markdown, and then blocks the release on `main`.
- `changeset publish` has no `--dry-run`; test the publish path by running the release script with credentials removed, never by hoping it stops in time.
