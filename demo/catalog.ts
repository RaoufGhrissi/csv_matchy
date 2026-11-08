import {
  Comparer,
  Condition,
  ConditionProperty,
  FieldType,
  Option,
  type WrongCell,
} from "sheet-matchy";

export const CATEGORIES = ["Books", "Games", "Music", "Toys"];
export const EXISTING_SKUS = ["BOO-0001", "GAM-0002"];
const SKU_FORMAT = /^[A-Z]{3}-\d{4}$/;

export type Lang = "en" | "fr";

type Cell = { value: string | number | null; rowIndex: number; colIndex: number };
export type Line = { [field: string]: Cell };

export const FIELDS = ["sku", "name", "price", "stock", "category"];
const REQUIRED_FIELDS = ["sku", "name", "price", "category"];

export interface ImportResponse {
  created: number;
  wrong_cells: WrongCell[];
  error?: string;
}

const texts = {
  en: {
    sku: "SKU",
    name: "Name",
    price: "Price",
    stock: "Stock",
    category: "Category",
    skuFormat: "Expected format: ABC-1234",
    required: "Required",
    notNumber: "Not a number",
    negative: "Must be 0 or more",
    duplicate: "Same SKU as row {row}",
    exists: "SKU already in the catalog",
    unknownCategory: "Unknown category",
    missingColumns: "Match these columns first: {fields}",
  },
  fr: {
    sku: "Référence",
    name: "Nom",
    price: "Prix",
    stock: "Stock",
    category: "Catégorie",
    skuFormat: "Format attendu : ABC-1234",
    required: "Obligatoire",
    notNumber: "Ce n'est pas un nombre",
    negative: "Doit être positif ou nul",
    duplicate: "Même référence que la ligne {row}",
    exists: "Référence déjà dans le catalogue",
    unknownCategory: "Catégorie inconnue",
    missingColumns: "Associez d'abord ces colonnes : {fields}",
  },
};

/** Columns for validation in the browser: matchy checks types and conditions. */
export function browserOptions(lang: Lang): Option[] {
  const t = texts[lang];
  return [
    new Option(t.sku, "sku", true, FieldType.string, [
      new Condition(ConditionProperty.regex, SKU_FORMAT.source, Comparer.e, t.skuFormat),
    ]),
    new Option(t.name, "name", true, FieldType.string, [
      new Condition(ConditionProperty.length, 60, Comparer.lte),
    ]),
    new Option(t.price, "price", true, FieldType.float, [
      new Condition(ConditionProperty.value, 0, Comparer.gte),
    ]),
    new Option(t.stock, "stock", false, FieldType.integer, [
      new Condition(ConditionProperty.value, 0, Comparer.gte),
    ]),
    new Option(t.category, "category", true, FieldType.string, [
      new Condition(ConditionProperty.value, CATEGORIES, Comparer.in),
    ]),
  ];
}

/** Columns for validation on the server: matchy only matches them. */
export function serverOptions(lang: Lang): Option[] {
  const t = texts[lang];
  return [
    new Option(t.sku, "sku"),
    new Option(t.name, "name"),
    new Option(t.price, "price"),
    new Option(t.stock, "stock"),
    new Option(t.category, "category"),
  ];
}

/**
 * What a server does with matchy's lines (see docs/examples): checks every
 * cell, reports problems by row and column, and saves nothing while any
 * cell is wrong. Runs in the page here, since the demo is a static site.
 */
export async function fakeImportApi(lines: Line[], lang: Lang): Promise<ImportResponse> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const t = texts[lang];
  const missing = REQUIRED_FIELDS.filter((field) => lines.length && !(field in lines[0]));
  if (missing.length) {
    const names = missing.map((field) => t[field as keyof typeof t]).join(", ");
    return { created: 0, wrong_cells: [], error: t.missingColumns.replace("{fields}", names) };
  }
  const issues = new Map<string, WrongCell>();
  const flag = (cell: Cell | undefined, message: string) => {
    if (!cell) return;
    const key = `${cell.rowIndex},${cell.colIndex}`;
    const wrong = issues.get(key) ?? { rowIndex: cell.rowIndex, colIndex: cell.colIndex, issues: [] };
    wrong.issues.push(message);
    issues.set(key, wrong);
  };
  const text = (cell: Cell | undefined) => String(cell?.value ?? "").trim();
  const firstRowOfSku = new Map<string, number>();

  for (const line of lines) {
    const sku = text(line.sku);
    if (!sku) flag(line.sku, t.required);
    else if (!SKU_FORMAT.test(sku)) flag(line.sku, t.skuFormat);
    else if (EXISTING_SKUS.includes(sku)) flag(line.sku, t.exists);
    else if (firstRowOfSku.has(sku)) {
      flag(line.sku, t.duplicate.replace("{row}", String(firstRowOfSku.get(sku)! + 2)));
    } else firstRowOfSku.set(sku, line.sku.rowIndex);

    if (!text(line.name)) flag(line.name, t.required);

    const price = text(line.price);
    if (!price) flag(line.price, t.required);
    else if (!Number.isFinite(Number(price))) flag(line.price, t.notNumber);
    else if (Number(price) < 0) flag(line.price, t.negative);

    const stock = text(line.stock);
    if (stock && !Number.isInteger(Number(stock))) flag(line.stock, t.notNumber);
    else if (stock && Number(stock) < 0) flag(line.stock, t.negative);

    const category = text(line.category);
    if (!category) flag(line.category, t.required);
    else if (!CATEGORIES.some((known) => known.toLowerCase() === category.toLowerCase())) {
      flag(line.category, t.unknownCategory);
    }
  }

  const wrong_cells = [...issues.values()];
  return { created: wrong_cells.length ? 0 : lines.length, wrong_cells };
}
