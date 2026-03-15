# Contribution Guidelines

Thank you for considering contributing to csv_matchy! We welcome contributions from everyone, whether it's reporting bugs, fixing issues, or adding new features.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Building](#building)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Package Structure](#package-structure)
- [Code of Conduct](#code-of-conduct)

## Ways to Contribute

- **Report Bugs**: Open an issue on GitHub with details about the bug
- **Fix Issues**: Browse open issues and submit a pull request
- **Add Features**: Implement new features and submit a pull request
- **Improve Documentation**: Fix gaps or errors in documentation
- **Review PRs**: Provide feedback on pull requests
- **Write Tests**: Add tests for new features or bug fixes

## Getting Started

1. **Fork the Repository**: Click the "Fork" button on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/csv_matchy
   cd csv_matchy
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/RaoufGhrissi/csv_matchy
   ```
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Install Dependencies

```bash
pnpm install
```

This installs all dependencies for the monorepo packages.

## Testing

We use Jest for testing. Each package has its own test suite.

### Run All Tests

```bash
pnpm test
```

### Run Tests for Specific Package

```bash
# Core package tests
pnpm test:core

# Vanilla package tests  
pnpm test:vanilla

# Or use pnpm filter
pnpm --filter @csv-matchy/core test
pnpm --filter @csv-matchy/vanilla test
```

### Running Tests in Watch Mode

```bash
# For core package
cd packages/core
pnpm test -- --watch

# For vanilla package
cd packages/vanilla
pnpm test -- --watch
```

### Writing Tests

Place test files in `src/__tests__/` directory with `.test.ts` extension:

```typescript
import { FieldValidator } from '../validators/FieldValidator';

describe('FieldValidator', () => {
  it('should validate mandatory fields', () => {
    const validator = new FieldValidator();
    const result = validator.validateMandatory('', 'name');
    expect(result).not.toBeNull();
  });
});
```

## Building

### Build All Packages

```bash
pnpm build
```

### Build Specific Package

```bash
pnpm build:core
pnpm build:vanilla
pnpm build:react
pnpm build:angular
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update the CHANGELOG.md** (if it exists)
5. **Submit a pull request** to the `main` branch

### PR Title Format

Use conventional commits style:
- `feat: add new validation type`
- `fix: resolve issue with mandatory fields`
- `docs: update README`
- `test: add tests for RowValidator`

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns in the project
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Run linting before committing (if configured)

## Package Structure

This is a monorepo with the following packages:

| Package | Path | Description |
|---------|------|-------------|
| `@csv-matchy/core` | `packages/core` | Core validation logic |
| `@csv-matchy/vanilla` | `packages/vanilla` | Vanilla JS/TS adapter |
| `@csv-matchy/react` | `packages/react` | React adapter |
| `@csv-matchy/angular` | `packages/angular` | Angular adapter |
| `@csv-matchy/theme-bootstrap` | `packages/theme-bootstrap` | Bootstrap styled |
| `@csv-matchy/theme-tailwind` | `packages/theme-tailwind` | Tailwind styled |

### Adding a New Package

1. Create directory in `packages/`
2. Add `package.json`, `tsconfig.json`, `jest.config.js`
3. Update `pnpm-workspace.yaml` (if needed)
4. Add to workspace in root `package.json`

## Code of Conduct

We expect all contributors to:
- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism professionally
- Focus on what is best for the community

## Questions?

- Open an issue on GitHub
- Check existing issues and discussions
- Review the README for usage examples

Thank you for contributing to csv_matchy!
