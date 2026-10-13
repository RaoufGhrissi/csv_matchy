# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## 2.0.0 - 2026-10-13

### Breaking changes
- The package can now be installed and imported from npm: `import { Matchy, Option, ... } from "csv_matchy"`. If you copied the `src` folder into your app, remove it and install the package instead.
- `ConditonProperty` is renamed to `ConditionProperty` (and `conditon_property.ts` to `condition_property.ts`).
- The package must be consumed through a bundler (Angular CLI, Vite, webpack, ...).
- Files are now read as Excel (`.xlsx`) instead of CSV. CSV files are no longer accepted; `.xls` is not supported either.

### Added
- Automatic matching of file headers to options.
- TypeScript type definitions.

### Fixed
- `bool` fields rejected "Yes"/"No" and accepted "0"/"1".
- `float` fields accepted values such as `12abc`.
- Spreadsheet header text was inserted as HTML, allowing script injection.
- Tab on the last column crashed instead of moving to the next row.
- Pressing Enter while editing could crash, and listeners piled up on each edit.
- Duplicate header names collided during auto-matching.
- Unreadable files now show an error instead of failing silently.
- Comparisons no longer use `eval`, so pages with a strict Content Security Policy work.

### Removed
- Unused `xlsx` dependency (version 0.18.5 has known vulnerabilities).

## 1.0.1 - 2024-04-11
- Initial npm release.
