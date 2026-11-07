# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## Unreleased

### Added
- `autoMatch` setting: `new Matchy(options, { autoMatch: false })` leaves every column unmatched so the user picks them. Settings are now optional and default to `{ validate: true, autoMatch: true }`.
- `markWrongCells([{ rowIndex, colIndex, issues }])` marks cells rejected by your backend, clearing the cells it marked last time, and `clearWrongCells()` clears them. Positions are the `rowIndex`/`colIndex` of the cells sent to `submit`.
- `labels` setting: every text matchy shows (file label, buttons, delete confirmation, file alerts) can be replaced, e.g. in French. Missing labels fall back to `defaultLabels` (English).
- Live error count (with `validate` on): after Pre Submit, a message shows how many cells are invalid and updates as cells are fixed or rows deleted. Submit is disabled until it reaches 0. Apps that validate on their backend (`validate: false`) are not affected.
- CSV export: an "Export CSV" button (shown once a file is loaded) downloads the matched columns under their display names, with edits applied and deleted rows left out. Values with commas, quotes or line breaks are quoted, and the file starts with a UTF-8 BOM so Excel shows accents. Also available as `exportCsv(fileName?)` and `toCsv()`.
- `buttons` setting: `{ preSubmit, submit, reset, export }`, each `{ className, style }`, replaces the default Bootstrap classes or adds inline styles.
- `Settings`, `Labels`, `ButtonStyle`, `ButtonsSettings` and `WrongCell` types and `defaultLabels` are exported.

### Changed
- The table fills its container and scrolls sideways on narrow screens, instead of squeezing columns and wrapping their content.
- `generateResult()` and `submit()` are typed: `lines` is a list of `{ [field]: Cell }`.

### Fixed
- Validation results are kept per cell instead of being read back from the page.
- A column picked and then set back to empty was sent under an empty `""` key.

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
