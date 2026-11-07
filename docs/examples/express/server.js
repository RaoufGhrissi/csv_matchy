// Product import API for csv_matchy, with Express.
// Run: npm install && npm start

import express from "express";
import cors from "cors";

const CATEGORIES = ["books", "games", "music", "toys"];
const SKU_FORMAT = /^[A-Z]{3}-\d{4}$/;
const REQUIRED_FIELDS = ["sku", "name", "price", "category"];

const catalog = new Map([
  ["BOO-0001", { name: "Already listed book" }],
  ["GAM-0002", { name: "Already listed game" }],
]);

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const text = (cell) => String(cell?.value ?? "").trim();

app.post("/products/import", (req, res) => {
  const lines = req.body.lines ?? [];
  const missing = REQUIRED_FIELDS.filter((field) => lines.length && !(field in lines[0]));
  if (missing.length) {
    return res.json({ created: 0, wrong_cells: [], error: `Match these columns first: ${missing.join(", ")}` });
  }

  const issues = new Map();
  const flag = (cell, message) => {
    if (!cell) return;
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

    if (!text(line.name)) flag(line.name, "Required");

    const price = text(line.price);
    if (!price) flag(line.price, "Required");
    else if (!Number.isFinite(Number(price))) flag(line.price, "Not a number");
    else if (Number(price) < 0) flag(line.price, "Must be 0 or more");

    const stock = text(line.stock);
    if (stock && !Number.isInteger(Number(stock))) flag(line.stock, "Not a number");
    else if (stock && Number(stock) < 0) flag(line.stock, "Must be 0 or more");

    const category = text(line.category);
    if (!category) flag(line.category, "Required");
    else if (!CATEGORIES.includes(category.toLowerCase())) flag(line.category, "Unknown category");
  }

  if (issues.size) {
    return res.json({ created: 0, wrong_cells: [...issues.values()] });
  }

  for (const line of lines) {
    catalog.set(text(line.sku), { name: text(line.name), price: Number(text(line.price)) });
  }
  res.json({ created: lines.length, wrong_cells: [] });
});

app.listen(3000, () => console.log("Listening on http://localhost:3000"));
