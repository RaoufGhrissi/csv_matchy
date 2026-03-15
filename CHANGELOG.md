# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Monorepo structure with pnpm workspaces
- `@csv-matchy/core` - Core validation logic package
- `@csv-matchy/vanilla` - Vanilla JS/TS adapter with event-based MatchyManager
- `@csv-matchy/react` - React adapter with useMatchyCore hook and MatchyTable component
- `@csv-matchy/angular` - Angular adapter with MatchyService and MatchyTableComponent
- `@csv-matchy/theme-bootstrap` - Bootstrap-styled table renderer
- `@csv-matchy/theme-tailwind` - Tailwind-styled table renderer
- Jest testing framework setup
- Comprehensive test suites for core and vanilla packages
- CONTRIBUTING.md guidelines for contributors
- MIT License
- Full README documentation

### Changed
- Existing `src/` code remains unchanged (original Angular component)
- Documentation moved to CONTRIBUTING.md

### Deprecated
- The original `csv_matchy` package (single npm package with web component) is now **deprecated** in favor of the new modular packages above. The original implementation in `src/` will be maintained for backwards compatibility but no new features will be added.

## [1.0.0] - Initial Release (Monorepo)

### Added
- Core validation logic extracted from original codebase
- Framework adapters for React and Angular
- Theme packages for Bootstrap and Tailwind styling
- Automated testing infrastructure

---

## How to Add New Entries

When making changes, add entries in this format:

```markdown
## [Version] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Change description

### Fixed
- Bug fix description

### Removed
- Removed feature description
```

### Version Categories
- **Added**: New features
- **Changed**: Existing functionality modifications
- **Fixed**: Bug fixes
- **Removed**: Features removed in this version
- **Deprecated**: Features that will be removed in future versions
