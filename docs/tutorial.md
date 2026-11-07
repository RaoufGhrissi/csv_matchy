# Tutorial: import a product catalog with csv_matchy

This tutorial builds a spreadsheet import for a product catalog, twice:

1. **[Validation in the browser](#part-1-validation-in-the-browser):** matchy checks every cell before anything is sent.
2. **[Validation on a server](#part-2-validation-on-a-server):** matchy sends the cells to your API, which checks them and returns the ones to fix.

Both run in the [live demo](https://raoufghrissi.github.io/csv_matchy/). Use its sample file, [products.xlsx](../demo/public/products.xlsx), to follow along. It has 25 products and a few mistakes on purpose.

| Column | Rule |
| --- | --- |
| SKU | Required, format `ABC-1234`, not already in the catalog, unique in the file |
| Name | Required, 60 characters at most |
| Price | Required, a number, 0 or more |
| Stock | Optional, a whole number, 0 or more |
| Category | Required, one of Books, Games, Music, Toys |

## Setup

```sh
npm install csv_matchy
```

csv_matchy is a web component, so it works with any framework or none. It needs a bundler (Vite, Angular CLI, webpack, …). Add a container to your page:

```html
<div id="importer"></div>
```

## Part 1: Validation in the browser

Describe each field with an `Option`: the name shown to the user, the key your app receives, whether it's required, its type, and extra `Condition`s.

```ts
import {
  Matchy, Option, Condition, FieldType, ConditionProperty, Comparer,
} from "csv_matchy";

const options = [
  new Option("SKU", "sku", true, FieldType.string, [
    new Condition(ConditionProperty.regex, "^[A-Z]{3}-\\d{4}$", Comparer.e, "Expected format: ABC-1234"),
  ]),
  new Option("Name", "name", true, FieldType.string, [
    new Condition(ConditionProperty.length, 60, Comparer.lte),
  ]),
  new Option("Price", "price", true, FieldType.float, [
    new Condition(ConditionProperty.value, 0, Comparer.gte),
  ]),
  new Option("Stock", "stock", false, FieldType.integer, [
    new Condition(ConditionProperty.value, 0, Comparer.gte),
  ]),
  new Option("Category", "category", true, FieldType.string, [
    new Condition(ConditionProperty.value, ["Books", "Games", "Music", "Toys"], Comparer.in),
  ]),
];
```

The last argument of a `Condition` is an optional message that replaces the default one, as for the SKU format above. `Comparer.in` ignores case.

Create the component, choose what happens on submit, and add it to the page:

```ts
const matchy = new Matchy(options, {
  blockInvalidSubmit: true,
  pagination: { enabled: true, itemsPerPage: 10 },
});

matchy.submit = async ({ lines }) => {
  // Every cell is valid here. Send the lines to your app.
  console.log(lines);
};

document.getElementById("importer")!.appendChild(matchy);
```

What the user does:

1. **Choose a file.** Columns are matched to your fields from their headers ("Product name" → Name, "Qty in stock" → Stock). Each match can be changed, and columns left unmatched, like "Internal note", are ignored.
2. **Pre Submit.** Unmatched columns are removed and every cell is checked. Invalid cells turn red, with the reason as a tooltip, and a message counts them.
3. **Fix the cells** by clicking them, or delete a row with its ×. The count updates as they go. With `blockInvalidSubmit`, **Submit** stays disabled until it reaches 0.
4. **Submit.** Your `submit` receives `lines`: one object per row, with a cell per matched field:

```json
[
  {
    "sku": { "value": "BOO-1001", "rowIndex": 0, "colIndex": 0 },
    "name": { "value": "The Pragmatic Programmer", "rowIndex": 0, "colIndex": 1 },
    "price": { "value": 42.5, "rowIndex": 0, "colIndex": 2 },
    "stock": { "value": 12, "rowIndex": 0, "colIndex": 3 },
    "category": { "value": "Books", "rowIndex": 0, "colIndex": 4 }
  }
]
```

Values keep the type they have in the spreadsheet, and a cell the user edited is sent as text. `rowIndex` and `colIndex` are the cell's position in the file: rows count from 0 after the header row, so row 0 is line 2 in Excel. Part 2 uses them.

**Export CSV** downloads the matched columns with the user's edits, if they'd rather fix the file than import it.

### In another language

Every text matchy shows can be replaced with `labels`, including validation messages. Missing labels stay in English (see `defaultLabels`):

```ts
const matchy = new Matchy(options, {
  blockInvalidSubmit: true,
  labels: {
    selectFile: "Choisir un fichier Excel :",
    preSubmit: "Vérifier",
    submit: "Envoyer",
    errorCount: "{count} cellule(s) invalide(s).",
    mandatoryMissing: "Champ obligatoire manquant",
    valueMismatch: "La valeur n'est pas {comparer} {value}",
    comparerGte: "supérieure ou égale à",
  },
});
```

The demo's FR button shows a full French translation ([demo/main.ts](../demo/main.ts)).

### What the browser can't check

The browser only knows what's in the file. It can't tell that `BOO-0001` is already in your catalog. It also shouldn't be trusted with your data: anyone can call your API without going through matchy. That's what Part 2 is for.

## Part 2: Validation on a server

Here matchy only matches the columns, and your API checks every cell. Because each cell carries its `rowIndex` and `colIndex`, the API can say exactly which cells are wrong, and matchy colors them in the table.

```
browser                                   your API
───────                                   ────────
lines: [{ sku: { value, rowIndex, colIndex }, … }]   ──►  check every cell
                                                          save nothing if one is wrong
markWrongCells(wrong_cells)                ◄──  { created, wrong_cells: [{ rowIndex, colIndex, issues }] }
```

### The front end

Options only need a name and a key. `validate: false` removes Pre Submit, so **Submit** is shown as soon as the file is loaded:

```ts
import { Matchy, Option } from "csv_matchy";

const matchy = new Matchy(
  [
    new Option("SKU", "sku"),
    new Option("Name", "name"),
    new Option("Price", "price"),
    new Option("Stock", "stock"),
    new Option("Category", "category"),
  ],
  { validate: false, pagination: { enabled: true, itemsPerPage: 10 } },
);

matchy.submit = async ({ lines }) => {
  const response = await fetch("http://localhost:8000/products/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines }),
  });
  const result = await response.json();

  matchy.markWrongCells(result.wrong_cells);
  if (result.error) {
    alert(result.error);
  } else if (result.wrong_cells.length) {
    alert(`${result.wrong_cells.length} cell(s) to fix. Nothing was saved.`);
  } else {
    alert(`${result.created} product(s) imported.`);
  }
};

document.getElementById("importer")!.appendChild(matchy);
```

`markWrongCells` clears the cells it marked last time, so after each submit the table shows the latest answer. Marks are kept when changing page, and editing a cell clears its mark. The user fixes the cells and submits again.

### The API

The API receives the lines, checks every cell, and answers with the wrong ones:

```json
{
  "created": 0,
  "wrong_cells": [
    { "rowIndex": 3, "colIndex": 0, "issues": ["Expected format: ABC-1234"] },
    { "rowIndex": 10, "colIndex": 0, "issues": ["Same SKU as row 2"] },
    { "rowIndex": 11, "colIndex": 0, "issues": ["SKU already in the catalog"] }
  ]
}
```

Three rules make it work well:

- **Report every problem at once.** Check all the lines before answering, so the user fixes everything in one go instead of one error per submit.
- **Put each problem on its cell.** Use the `rowIndex` and `colIndex` received with that cell. A cell can have several issues.
- **Save nothing while a cell is wrong.** Otherwise a second submit would fail on "already in the catalog" for the lines saved by the first one. In a real database, save the lines in one transaction.

The same API in two languages. Both behave exactly like the demo:

<details open>
<summary><strong>Python (FastAPI)</strong>, full file: <a href="examples/fastapi/main.py">examples/fastapi/main.py</a></summary>

```python
class MatchyCell(BaseModel):
    value: str | None = None
    rowIndex: int
    colIndex: int

    @field_validator("value", mode="before")
    @classmethod
    def to_text(cls, value):
        return None if value is None else str(value).strip()


class ImportIn(BaseModel):
    lines: list[dict[str, MatchyCell]]


@app.post("/products/import", response_model=ImportOut)
def import_products(entry: ImportIn):
    issues = defaultdict(list)

    def flag(cell, message):
        issues[(cell.rowIndex, cell.colIndex)].append(message)

    first_row_of_sku = {}
    for line in entry.lines:
        sku = line["sku"].value or ""
        if not sku:
            flag(line["sku"], "Required")
        elif not SKU_FORMAT.match(sku):
            flag(line["sku"], "Expected format: ABC-1234")
        elif sku in catalog:
            flag(line["sku"], "SKU already in the catalog")
        elif sku in first_row_of_sku:
            flag(line["sku"], f"Same SKU as row {first_row_of_sku[sku] + 2}")
        else:
            first_row_of_sku[sku] = line["sku"].rowIndex
        # … name, price, stock and category the same way

    if issues:
        return ImportOut(wrong_cells=[
            WrongCell(rowIndex=row, colIndex=col, issues=messages)
            for (row, col), messages in issues.items()
        ])

    for line in entry.lines:
        catalog[line["sku"].value] = {"name": line["name"].value}
    return ImportOut(created=len(entry.lines))
```

Converting `value` to text in `MatchyCell` matters: spreadsheet cells arrive as numbers or text, depending on the file.

</details>

<details open>
<summary><strong>Node (Express)</strong>, full file: <a href="examples/express/server.js">examples/express/server.js</a></summary>

```js
app.post("/products/import", (req, res) => {
  const lines = req.body.lines ?? [];
  const issues = new Map();
  const flag = (cell, message) => {
    const key = `${cell.rowIndex},${cell.colIndex}`;
    const wrong = issues.get(key) ?? { rowIndex: cell.rowIndex, colIndex: cell.colIndex, issues: [] };
    wrong.issues.push(message);
    issues.set(key, wrong);
  };

  const firstRowOfSku = new Map();
  for (const line of lines) {
    const sku = text(line.sku);
    if (!sku) flag(line.sku, "Required");
    else if (!SKU_FORMAT.test(sku)) flag(line.sku, "Expected format: ABC-1234");
    else if (catalog.has(sku)) flag(line.sku, "SKU already in the catalog");
    else if (firstRowOfSku.has(sku)) flag(line.sku, `Same SKU as row ${firstRowOfSku.get(sku) + 2}`);
    else firstRowOfSku.set(sku, line.sku.rowIndex);
    // … name, price, stock and category the same way
  }

  if (issues.size) {
    return res.json({ created: 0, wrong_cells: [...issues.values()] });
  }

  for (const line of lines) catalog.set(text(line.sku), { name: text(line.name) });
  res.json({ created: lines.length, wrong_cells: [] });
});
```

</details>

The full files also check that the required columns were matched at all. If one wasn't, there's no cell to mark, so they return an `error` message instead.

### Run it

```sh
# Python
cd docs/examples/fastapi
pip install -r requirements.txt
uvicorn main:app --reload        # http://localhost:8000

# or Node
cd docs/examples/express
npm install
npm start                        # http://localhost:3000
```

Point the `fetch` in the front end at one of them, import `products.xlsx`, and you get the same results as the demo's "Validation on a server" tab.

## Both together

The two approaches combine. Keep `validate: true` so users fix format mistakes before anything is sent, and still check everything on the server, which is the only place that knows your data. `markWrongCells` works the same in both modes:

```ts
const matchy = new Matchy(options, { blockInvalidSubmit: true });
matchy.submit = async ({ lines }) => {
  const result = await sendToApi(lines);
  matchy.markWrongCells(result.wrong_cells);
};
```

## Next steps

- All settings are in the [README](../README.md#settings).
- Questions and ideas are welcome in [issues](https://github.com/RaoufGhrissi/csv_matchy/issues).
