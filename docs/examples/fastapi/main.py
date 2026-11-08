"""Product import API for sheet-matchy, with FastAPI.

Run: pip install -r requirements.txt && uvicorn main:app --reload
"""

import re
from collections import defaultdict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

CATEGORIES = {"books", "games", "music", "toys"}
SKU_FORMAT = re.compile(r"^[A-Z]{3}-\d{4}$")
REQUIRED_FIELDS = ["sku", "name", "price", "category"]

catalog: dict[str, dict] = {
    "BOO-0001": {"name": "Already listed book"},
    "GAM-0002": {"name": "Already listed game"},
}

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


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


class WrongCell(BaseModel):
    rowIndex: int
    colIndex: int
    issues: list[str]


class ImportOut(BaseModel):
    created: int = 0
    wrong_cells: list[WrongCell] = []
    error: str | None = None


def as_number(text: str):
    try:
        return float(text)
    except ValueError:
        return None


@app.post("/products/import", response_model=ImportOut)
def import_products(entry: ImportIn):
    missing = [field for field in REQUIRED_FIELDS if entry.lines and field not in entry.lines[0]]
    if missing:
        return ImportOut(error=f"Match these columns first: {', '.join(missing)}")

    issues = defaultdict(list)

    def flag(cell: MatchyCell | None, message: str):
        if cell is not None:
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

        if not line["name"].value:
            flag(line["name"], "Required")

        price = line["price"].value or ""
        if not price:
            flag(line["price"], "Required")
        elif as_number(price) is None:
            flag(line["price"], "Not a number")
        elif as_number(price) < 0:
            flag(line["price"], "Must be 0 or more")

        stock_cell = line.get("stock")
        stock = stock_cell.value if stock_cell else None
        if stock and (as_number(stock) is None or not as_number(stock).is_integer()):
            flag(stock_cell, "Not a number")
        elif stock and as_number(stock) < 0:
            flag(stock_cell, "Must be 0 or more")

        category = line["category"].value or ""
        if not category:
            flag(line["category"], "Required")
        elif category.lower() not in CATEGORIES:
            flag(line["category"], "Unknown category")

    if issues:
        return ImportOut(
            wrong_cells=[
                WrongCell(rowIndex=row, colIndex=col, issues=messages)
                for (row, col), messages in issues.items()
            ]
        )

    for line in entry.lines:
        catalog[line["sku"].value] = {"name": line["name"].value, "price": float(line["price"].value)}
    return ImportOut(created=len(entry.lines))
