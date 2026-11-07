# Matchy

[![npm version](https://img.shields.io/npm/v/csv_matchy)](https://www.npmjs.com/package/csv_matchy)
[Build status](https://github.com/RaoufGhrissi/csv_matchy/actions/workflows/build.yml) · [ISC license](LICENSE)

A TypeScript web component for importing Excel spreadsheets, matching columns to your fields, and validating and editing cells before submission.

## Features

- Upload `.xlsx` files and automatically suggest column mappings.
- Validate required values, types, lengths, ranges, and regular expressions, with a live count of invalid cells.
- Edit cells, remove rows, and highlight invalid values, including errors returned by your API.
- Paginate large files and export the edited table as CSV.
- Translate every label, and restyle the buttons.
- Submit mapped data to your own application or API.

CSV and `.xls` uploads are not supported.

## Installation

```sh
npm install csv_matchy
```

Use a browser application with a bundler such as Angular CLI, Vite, or webpack. TypeScript declarations are included.

## Quick start

Add a container to your page:

```html
<div id="matchy"></div>
```

Then create the component after the container is mounted:

```ts
import {
  Matchy, Option, Condition, FieldType, ConditionProperty, Comparer,
} from "csv_matchy";

const options = [
  new Option("Name", "name", true, FieldType.string),
  new Option("Age", "age", true, FieldType.integer, [
    new Condition(ConditionProperty.value, 0, Comparer.gte),
  ]),
];

const matchy = new Matchy(options);
matchy.submit = async (data) => {
  // Send data.lines to your API or handle it in your application.
  console.log(data.lines);
};
document.getElementById("matchy")!.appendChild(matchy);
```

Upload a file, review the column mappings, choose **Pre Submit** to validate, then edit cells and choose **Submit**. Invalid cells are highlighted and counted, and **Submit** stays disabled until none are left. Your application still decides whether to accept the submitted data.

Each submitted line maps field keys to cells containing `value`, `rowIndex`, and `colIndex`.

## Usage

Matchy registers the `app-matchy` element and uses Shadow DOM with Bootstrap styles loaded from a CDN. Keep that element name reserved when integrating it into your application.

### Validation options

```ts
new Option(display_value, value, mandatory, type, conditions);
new Condition(property, value, comparer, custom_fail_message);
```

| Option argument | Purpose | Default |
| --- | --- | --- |
| `display_value` | Label shown in column mappings | `""` |
| `value` | Field key in submitted data | `null` |
| `mandatory` | Require a value in mapped cells | `false` |
| `type` | `FieldType.string`, `integer`, `float`, or `bool` | `FieldType.string` |
| `conditions` | Additional validation rules | `[]` |

Boolean fields accept `"Yes"` and `"No"`.

Conditions use `ConditionProperty.value`, `length`, or `regex`. Comparers are `Comparer.gt`, `gte`, `lt`, `lte`, `e`, and `in`; the default is `e`. A condition value is a number, string, or array of strings. An optional custom message replaces the default failure message.

```ts
import { Condition, ConditionProperty, Comparer } from "csv_matchy";

const maxLength = new Condition(ConditionProperty.length, 30, Comparer.lte);
const allowedValues = new Condition(ConditionProperty.value, ["AA", "BB"], Comparer.in);
const registrationNumber = new Condition(ConditionProperty.regex, "^\\d{8}-\\d{2}$");
```

### Settings

The second constructor argument is optional; every setting has a default.

```ts
new Matchy(options, {
  validate: true,
  autoMatch: true,
  pagination: { enabled: true, itemsPerPage: 20 },
  labels: { submit: "Envoyer", reset: "Réinitialiser" },
  buttons: { submit: { className: "btn btn-dark", style: "border-radius: 0" } },
});
```

| Setting | Purpose | Default |
| --- | --- | --- |
| `validate` | Show **Pre Submit**, validate cells in the browser and block **Submit** while cells are invalid. Set `false` when your API validates: **Submit** is shown right away. | `true` |
| `autoMatch` | Suggest a field for each column from its header. Set `false` to let the user pick every column. | `true` |
| `pagination` | `{ enabled, itemsPerPage }`: show the table a page at a time. Edits and errors are kept across pages, and submit and export include every row. | `{ enabled: false, itemsPerPage: 20 }` |
| `labels` | Replace any text Matchy shows. Missing labels use `defaultLabels`. | English |
| `buttons` | `{ preSubmit, submit, reset, export }`, each `{ className, style }`. `className` replaces the default Bootstrap classes. | Bootstrap buttons |

Labels are `selectFile`, `preSubmit`, `submit`, `reset`, `export`, `confirmDelete`, `noFile`, `wrongFileType`, `unreadableFile`, `noMatchedColumns`, `errorCount`, `noErrors`, `previous`, `next`, `pageInfo`, and `page`. Placeholders are replaced in `errorCount` (`{count}`), `pageInfo` (`{start}`, `{end}`, `{total}`), and `page` (`{page}`, `{pages}`):

```ts
labels: {
  errorCount: "{count} cellule(s) invalide(s).",
  pageInfo: "Lignes {start}-{end} sur {total}",
  page: "Page {page} sur {pages}",
}
```

### Export

Once a file is loaded, **Export CSV** downloads the matched columns under their display names, with edits applied and deleted rows left out. The file is UTF-8 with a BOM, so Excel shows accents. Call `matchy.exportCsv(fileName)` to trigger it yourself, or `matchy.toCsv()` to get the text.

### Angular

Create Matchy after Angular has initialized the container. Use your own component selector; `app-matchy` is registered by the library.

```ts
import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { Matchy, Option, FieldType } from "csv_matchy";

@Component({
  selector: "app-spreadsheet-import",
  template: '<div #container></div>',
})
export class SpreadsheetImportComponent implements AfterViewInit {
  @ViewChild("container") container!: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    const matchy = new Matchy([
      new Option("Name", "name", true, FieldType.string),
    ]);
    matchy.submit = async (data) => {
      console.log(data.lines);
    };
    this.container.nativeElement.appendChild(matchy);
  }
}
```

### React

Mount the component with a ref and remove it when the effect cleans up. This also handles React Strict Mode's effect setup and cleanup cycle.

```tsx
import { useEffect, useRef } from "react";
import { Matchy, Option, FieldType } from "csv_matchy";

export function SpreadsheetImport() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const matchy = new Matchy([
      new Option("Name", "name", true, FieldType.string),
    ]);
    matchy.submit = async (data) => {
      console.log(data.lines);
    };
    container.current!.appendChild(matchy);
    return () => matchy.remove();
  }, []);

  return <div ref={container} />;
}
```

### Errors from your API

Each submitted cell includes its original zero-based `rowIndex` and `colIndex`. Send them to your API, have it return the cells it rejects with those coordinates, and pass them to `markWrongCells`:

```ts
matchy.submit = async (data) => {
  const response = await api.import(data.lines);
  // response.wrong_cells: [{ rowIndex: 0, colIndex: 1, issues: ["This value already exists."] }]
  matchy.markWrongCells(response.wrong_cells);
};
```

Each call clears the cells marked by the previous one, so the table always shows the latest response. Marks are kept across pages, and editing a cell clears its mark. `matchy.clearWrongCells()` clears them all. Use `validate: false` when your API does all the validation.

## Contributing

Bug reports and contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and check the [changelog](CHANGELOG.md).

## License

[ISC](LICENSE) — Abderraouf Ghrissi and Mahdi Cheikhrouhou.
