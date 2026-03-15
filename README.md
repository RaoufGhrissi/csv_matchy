# csv_matchy

A flexible CSV validation library with support for multiple frameworks and styling options.

## Features

- **Validation Types**: String, integer, float, boolean
- **Custom Conditions**: Value comparison, regex, length checks
- **Multiple Frameworks**: React, Angular, Vanilla JS
- **Styling**: Default styles, Bootstrap, Tailwind, or custom CSS
- **Visual Feedback**: Invalid cells highlighted with error tooltips

## Packages

| Package                       | Description                                |
| ----------------------------- | ------------------------------------------ |
| `@csv-matchy/core`            | Core validation logic (framework-agnostic) |
| `@csv-matchy/vanilla`         | Pure JavaScript/TypeScript adapter         |
| `@csv-matchy/react`           | React adapter with components              |
| `@csv-matchy/angular`         | Angular adapter with components            |
| `@csv-matchy/theme-bootstrap` | Bootstrap-styled components                |
| `@csv-matchy/theme-tailwind`  | Tailwind-styled components                 |

## Quick Start

### React

```bash
npm install @csv-matchy/react
```

```tsx
import { useMatchyCore, MatchyTable } from "@csv-matchy/react";
import {
  Option,
  FieldType,
  Condition,
  ConditionProperty,
  Comparer,
} from "@csv-matchy/core";

const rules = [
  {
    field: "name",
    option: new Option("Name", "name", true, FieldType.string, []),
  },
  {
    field: "age",
    option: new Option("Age", "age", true, FieldType.integer, [
      new Condition(ConditionProperty.value, 0, Comparer.gte),
      new Condition(ConditionProperty.value, 150, Comparer.lte),
    ]),
  },
];

function App() {
  const { validate, results } = useMatchyCore(rules);
  const data = [
    { name: "John", age: "25" },
    { name: "", age: "not-a-number" },
  ];

  return (
    <div>
      <button onClick={() => validate(data)}>Validate</button>
      {results && (
        <MatchyTable
          data={data}
          headers={["name", "age"]}
          invalidCells={results.flatMap((r) => r.invalidCells)}
        />
      )}
    </div>
  );
}
```

### Angular

```bash
npm install @csv-matchy/angular
```

```typescript
import { Component } from "@angular/core";
import { MatchyService } from "@csv-matchy/angular";

@Component({
  selector: "app-validator",
  template: `
    <button (click)="validate()">Validate</button>
    <csv-matchy-table
      [data]="data"
      [headers]="headers"
      [invalidCells]="invalidCells"
    ></csv-matchy-table>
  `,
})
export class ValidatorComponent {
  data = [{ name: "John", age: "25" }];
  headers = ["name", "age"];
  invalidCells: any[] = [];

  constructor(private matchy: MatchyService) {}

  validate() {
    const results = this.matchy.validate(this.data, rules);
    this.invalidCells = results.flatMap((r) => r.invalidCells);
  }
}
```

### Vanilla JS

```bash
npm install @csv-matchy/vanilla
```

```typescript
import { MatchyManager, TableRenderer } from "@csv-matchy/vanilla";

const manager = new MatchyManager(rules);
const renderer = new TableRenderer("container");

manager.loadData([
  { name: "John", age: "25" },
  { name: "Jane", age: "30" },
]);

manager.on("validation-complete", (results) => {
  renderer.render(manager.getData(), ["name", "age"], results.invalidCells);
});

manager.validate();
```

## Styling

### Default Styles

The `MatchyTable` component comes with built-in styles:

- Clean modern design
- Green background for valid cells
- Red background for invalid cells
- Hover effects
- Error tooltips on hover

### CSS Variables

Override colors easily:

```tsx
<MatchyTable
  data={data}
  headers={headers}
  invalidCells={invalidCells}
  className="my-table"
/>

<style>{`
  .my-table {
    --matchy-valid-bg: #e6fffa;
    --matchy-invalid-bg: #fff5f5;
  }
`}</style>
```

### Bootstrap

```bash
npm install @csv-matchy/react bootstrap
```

```tsx
import { MatchyTableBootstrap } from "@csv-matchy/react";
import "bootstrap/dist/css/bootstrap.min.css";

<MatchyTableBootstrap
  data={data}
  headers={headers}
  invalidCells={invalidCells}
/>;
```

### Tailwind

```bash
npm install @csv-matchy/react
```

```tsx
import { MatchyTableTailwind } from "@csv-matchy/react";

<MatchyTableTailwind
  data={data}
  headers={headers}
  invalidCells={invalidCells}
/>;
```

## API Reference

### Option

| Field           | Type        | Description      |
| --------------- | ----------- | ---------------- |
| `display_value` | string      | Display name     |
| `value`         | string      | Field identifier |
| `mandatory`     | boolean     | Required field   |
| `type`          | FieldType   | Data type        |
| `conditions`    | Condition[] | Validation rules |

### Condition

| Field                 | Type              | Description         |
| --------------------- | ----------------- | ------------------- |
| `property`            | ConditionProperty | What to validate    |
| `value`               | any               | Compare value       |
| `comparer`            | Comparer          | Comparison operator |
| `custom_fail_message` | string            | Custom error        |

### Enums

**FieldType**: `string`, `integer`, `float`, `bool`

**ConditionProperty**: `value`, `regex`, `length`

**Comparer**: `gt`, `gte`, `lt`, `lte`, `e`, `in`

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Test specific package
pnpm test:core
```

## License

MIT - See [LICENSE](LICENSE) file.

## Support

- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/RaoufGhrissi/matchy/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/RaoufGhrissi/matchy/discussions) for questions

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for:

## Authors

- Mahdi Cheikhrouhou
- Abderraouf Ghrissi

## Acknowledgments

Thanks to all contributors and users who have helped make csv_matchy better!
