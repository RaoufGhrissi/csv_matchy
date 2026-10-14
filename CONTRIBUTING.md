# Contributing to Matchy

Bug reports, documentation improvements, and focused fixes are welcome. Discuss larger features or architecture changes in an issue before implementing them.

## Local setup

Fork the repository, clone your fork, and create a branch from the latest upstream `main`. Use Node.js 24 to match CI.

```sh
npm ci
npm run build
```

Edit TypeScript files in `src/`. The build generates `dist/`, which is ignored by Git. Documentation lives in `docs/`; screenshots are kept in `docs/assets/`.

## Reporting an issue

Use the [issue tracker](https://github.com/RaoufGhrissi/csv_matchy/issues). Include the package version, browser and framework, steps to reproduce, and expected versus actual behavior. Use a small, anonymized spreadsheet when a sample is needed.

## Opening a pull request

- Keep each PR focused and follow the existing code style.
- Explain the change and link any related issue.
- Run `npm run build` for code changes and verify the affected workflow in a browser application.
- Check links and examples for documentation changes.
- Describe what you verified. There is currently no automated test suite; `npm test` is a placeholder.

For behavior changes, update the relevant documentation and changelog. Be respectful when reporting issues and reviewing contributions.

## Releases (maintainers)

1. Open a PR updating `CHANGELOG.md` and the version in `package.json` and `package-lock.json`:

   ```sh
   npm version <major|minor|patch> --no-git-tag-version
   ```

2. After merging, tag the updated `main` commit and push that tag. For example, for version `2.0.1`:

   ```sh
   git switch main
   git pull --ff-only
   git tag v2.0.1
   git push origin v2.0.1
   ```

   The [publish workflow](.github/workflows/publish.yml) checks that the tag matches the package version and stages the npm release.

3. Approve the staged version on npmjs.com using 2FA, or use `npm stage list` and `npm stage approve <id>`. The version is not live until approved.
