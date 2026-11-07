import { Condition } from "./models/classes/condition";
import { Comparer } from "./models/enums/comparer";
import { ConditionProperty } from "./models/enums/condition_property";
import { FieldType } from "./models/enums/field_type";
import { Option } from "./models/classes/option";
import {
  importExternalUi,
  createButton,
  tag,
  field,
  bootstrap,
  ids,
  createLabel,
  createElement,
  button,
  isEmpty,
  evaluateConditions,
  textPerComparer,
} from "./modules/common";
import { Context } from "./models/classes/context";
import { Cell } from "./models/classes/cell";
import { UploadEntry } from "./models/classes/uploadEntry";

const editableCellClassName = "editableCell";
const editedCellClassName = "editedCell";
const invalidCellClassName = "invalidCell";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

import readXlsxFile from "read-excel-file";
import * as stringSimilarity from "string-similarity";

export interface Labels {
  selectFile: string;
  preSubmit: string;
  submit: string;
  reset: string;
  confirmDelete: string;
  noFile: string;
  wrongFileType: string;
  unreadableFile: string;
  errorCount: string;
  noErrors: string;
  export: string;
  noMatchedColumns: string;
  previous: string;
  next: string;
  pageInfo: string;
  page: string;
}

export const defaultLabels: Labels = {
  selectFile: "Select an Excel File :",
  preSubmit: "Pre Submit",
  submit: "Submit",
  reset: "Reset",
  confirmDelete: "Are you sure you want to delete this item ?",
  noFile: "Please select a file.",
  wrongFileType: "Please select an Excel file (.xlsx).",
  unreadableFile:
    "Could not read this file. Please check it is a valid .xlsx file.",
  errorCount:
    "{count} invalid cell(s). Fix the cells in red before submitting, click a cell to edit it.",
  noErrors: "All cells are valid. Your data is ready to submit.",
  export: "Export CSV",
  noMatchedColumns: "Match at least one column before exporting.",
  previous: "Previous",
  next: "Next",
  pageInfo: "Showing {start}-{end} of {total} rows",
  page: "Page {page} of {pages}",
};

export interface ButtonStyle {
  className?: string;
  style?: string;
}

export interface ButtonsSettings {
  preSubmit?: ButtonStyle;
  submit?: ButtonStyle;
  reset?: ButtonStyle;
  export?: ButtonStyle;
}

export interface Settings {
  validate?: boolean;
  autoMatch?: boolean;
  labels?: Partial<Labels>;
  buttons?: ButtonsSettings;
  pagination?: { enabled?: boolean; itemsPerPage?: number };
}

interface ResolvedSettings {
  validate: boolean;
  autoMatch: boolean;
  labels: Labels;
  buttons: ButtonsSettings;
  pagination: { enabled: boolean; itemsPerPage: number };
}

export interface WrongCell {
  rowIndex: number;
  colIndex: number;
  issues: string[];
}

class SelectedCell {
  cell: HTMLElement;
  rowIndex: number;
  colIndex: number;

  constructor(cell: HTMLElement, rowIndex: number, colIndex: number) {
    this.cell = cell;
    this.rowIndex = rowIndex;
    this.colIndex = colIndex;
  }
}

export class Matchy extends HTMLElement {
  shadow: ShadowRoot;
  defaultOption: Option;
  options: Option[];
  settings: ResolvedSettings;
  rows: string[][];
  cols: Option[];
  fileHeader: string[];
  values: Map<string, string>;
  context: Context;
  deletedRows: Set<number>;
  currentSelectedcell: SelectedCell | null = null;
  wrongCells: WrongCell[] = [];
  cellIssues = new Map<string, string[]>();
  editedCells = new Set<string>();
  currentPage = 1;

  constructor(
    mainOptions: Option[] = [],
    setting: Settings = {}
  ) {
    super();
    this.defaultOption = new Option();
    this.options = [];
    this.rows = [];
    this.cols = [];
    this.fileHeader = [];
    this.values = new Map<string, string>();
    this.context = new Context();
    this.deletedRows = new Set<number>();
    this.setPossibleOptions(mainOptions);
    this.settings = {
      validate: setting.validate ?? true,
      autoMatch: setting.autoMatch ?? true,
      labels: { ...defaultLabels, ...setting.labels },
      buttons: setting.buttons ?? {},
      pagination: {
        enabled: setting.pagination?.enabled ?? false,
        itemsPerPage: Math.max(1, setting.pagination?.itemsPerPage ?? 20),
      },
    };

    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `<style>
          :host .container {
            max-width: none;
            padding: 0;
          }

          table.table {
            font-size: 12px;
            display: block;
            max-width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          table.table th,
          table.table td {
            white-space: nowrap;
          }

          table.table select {
            min-width: 10rem;
          }

          table,
          th,
          td {
            border: 2px solid;
          }

          td {
            padding: 2px;
            text-align: left;
            height: 1em;
          }

          th {
            background-color: lightgray;
            text-align: left;
            padding: 8px;
          }

          tr:hover {
            background-color: #ddd;
          }

          .editableCell {
            padding: 0;
            border: none;
            border-spacing: 0;
            background-color: #ffcc00;
          }

          .editableCell input {
            min-width: 8rem;
            padding: 0;
            width: 100%;
            margin: 0;
            outline: none;
            border-top-style: hidden;
            border-right-style: hidden;
            border-left-style: hidden;
            border-bottom-style: hidden;
            background-color: #ffcc00;
          }

          .invalidCell {
            background-color: #fd5959;
          }

          .delete_icon:hover {
            color: black;
          }

          .delete_icon:before {
            content: "x";
          }

          .error-display {
            margin: 8px;
            padding: 8px 12px;
            border-radius: 4px;
            background-color: #fdecea;
            color: #842029;
          }

          .matchy-pagination {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin: 8px 0;
            font-size: 12px;
          }

          .matchy-pagination-controls {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .error-display.success {
            background-color: #d1e7dd;
            color: #0f5132;
          }

        </style>`;

    importExternalUi(this.shadow);
    this.initializeComponent();
    this.init();
  }

  setPossibleOptions(options: Option[]) {
    this.defaultOption = new Option();
    this.options = [this.defaultOption, ...options];
  }

  initializeComponent() {
    const container = createElement(tag.div, {}, [bootstrap["container"]]);
    const form = createElement(tag.form);
    const formGroup = createElement(tag.div, {}, [bootstrap["formGroup"]]);
    const labels = this.settings.labels;
    const selectFileLabel = createLabel(labels.selectFile, {
      for: ids.uploadedFile,
    });
    const fileInput = createElement(
      tag.input,
      {
        type: "file",
        id: ids.uploadedFile,
        name: "uploadedFile",
      },
      ["form-control"]
    );
    fileInput.addEventListener("change", this.uploadFile.bind(this));
    formGroup.appendChild(selectFileLabel);
    formGroup.appendChild(fileInput);
    form.appendChild(formGroup);
    form.appendChild(
      this.createActionButton(
        "preSubmit",
        ids.preSubmitFile,
        ["btn", "btn-primary", "mt-2", "m-2"],
        () => this.preSubmitFile()
      )
    );
    form.appendChild(
      this.createActionButton(
        "submit",
        ids.submitFile,
        ["btn", "btn-success", "mt-2", "m-2"],
        () => this.submitFile()
      )
    );
    form.appendChild(
      this.createActionButton(
        "reset",
        ids.resetFile,
        ["btn", "btn-success", "mt-2", "m-2"],
        () => {
          this.uploadFile();
          this.hideElementById(ids.resetFile);
          this.hideElementById(ids.submitFile);
        }
      )
    );
    form.appendChild(
      this.createActionButton(
        "export",
        ids.exportFile,
        ["btn", "btn-outline-secondary", "mt-2", "m-2"],
        () => this.exportCsv()
      )
    );
    const errorDisplay = createElement(tag.div, { id: ids.errorDisplay }, [
      "error-display",
    ]);
    errorDisplay.setAttribute("role", "status");
    form.appendChild(errorDisplay);
    container.appendChild(form);
    this.shadow.appendChild(container);
    const table = createElement(tag.table, { id: ids.fileContent }, [
      bootstrap["table"],
      "table-hover",
      "table-striped",
    ]);
    this.shadow.appendChild(table);
    this.shadow.appendChild(this.createPagination());
    this.hideElementById(ids.preSubmitFile);
    this.hideElementById(ids.submitFile);
    this.hideElementById(ids.resetFile);
    this.hideElementById(ids.errorDisplay);
    this.hideElementById(ids.exportFile);
    this.hideElementById(ids.pagination);
    this.initEventListeners();
  }

  createPagination() {
    const container = createElement(tag.div, { id: ids.pagination }, [
      "matchy-pagination",
    ]);
    const info = createElement(tag.span, { id: ids.paginationInfo });
    const controls = createElement(tag.div, {}, ["matchy-pagination-controls"]);
    const pageButton = (id: string, text: string, onClick: () => void) =>
      createButton(
        text,
        { id, type: button.button },
        ["btn", "btn-sm", "btn-outline-secondary"],
        { click: onClick }
      );
    controls.appendChild(
      pageButton(ids.previousPage, this.settings.labels.previous, () =>
        this.goToPage(this.currentPage - 1)
      )
    );
    controls.appendChild(createElement(tag.span, { id: ids.paginationPage }));
    controls.appendChild(
      pageButton(ids.nextPage, this.settings.labels.next, () =>
        this.goToPage(this.currentPage + 1)
      )
    );
    container.appendChild(info);
    container.appendChild(controls);
    return container;
  }

  activeRowIndexes() {
    const indexes: number[] = [];
    for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
      if (!this.deletedRows.has(rowIndex)) indexes.push(rowIndex);
    }
    return indexes;
  }

  totalPages() {
    const perPage = this.settings.pagination.itemsPerPage;
    return Math.max(1, Math.ceil(this.activeRowIndexes().length / perPage));
  }

  pageRowIndexes() {
    const active = this.activeRowIndexes();
    if (!this.settings.pagination.enabled) return active;
    const perPage = this.settings.pagination.itemsPerPage;
    const start = (this.currentPage - 1) * perPage;
    return active.slice(start, start + perPage);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages() || page === this.currentPage) {
      return;
    }
    if (this.currentSelectedcell) {
      const { cell, rowIndex, colIndex } = this.currentSelectedcell;
      this.endEditMode(cell, rowIndex, colIndex);
    }
    this.currentPage = page;
    this.renderBody();
  }

  renderBody() {
    const table = this.shadow.querySelector(
      `table[id='${ids.fileContent}']`
    ) as HTMLTableElement | null;
    if (table == null) return;
    table.tBodies[0]?.replaceChildren();
    this.generateTableBody(table);
    this.paintRenderedCells();
    this.updatePagination();
  }

  updatePagination() {
    const container = this.shadow.getElementById(ids.pagination);
    if (container == null) return;
    const total = this.activeRowIndexes().length;
    if (!this.settings.pagination.enabled || total === 0) {
      container.style.display = "none";
      return;
    }
    const pages = this.totalPages();
    const perPage = this.settings.pagination.itemsPerPage;
    const labels = this.settings.labels;
    const start = (this.currentPage - 1) * perPage + 1;
    const end = Math.min(this.currentPage * perPage, total);
    container.style.display = "flex";
    (this.shadow.getElementById(ids.paginationInfo) as HTMLElement).textContent =
      labels.pageInfo
        .replace("{start}", String(start))
        .replace("{end}", String(end))
        .replace("{total}", String(total));
    (this.shadow.getElementById(ids.paginationPage) as HTMLElement).textContent =
      labels.page
        .replace("{page}", String(this.currentPage))
        .replace("{pages}", String(pages));
    (this.shadow.getElementById(ids.previousPage) as HTMLButtonElement).disabled =
      this.currentPage === 1;
    (this.shadow.getElementById(ids.nextPage) as HTMLButtonElement).disabled =
      this.currentPage === pages;
  }

  createActionButton(
    name: keyof ButtonsSettings,
    id: string,
    defaultClasses: string[],
    onClick: () => void
  ) {
    const custom = this.settings.buttons[name];
    const classes = custom?.className
      ? custom.className.split(/\s+/).filter(Boolean)
      : defaultClasses;
    const actionButton = createButton(
      this.settings.labels[name],
      { id, type: button.button },
      classes,
      { click: onClick }
    );
    if (custom?.style) {
      actionButton.setAttribute("style", custom.style);
    }
    return actionButton;
  }

  initEventListeners() {
    this.addEventListener("keydown", (event) => {
      // Check if the pressed key is Tab
      if (event.key === "Tab") {
        if (this.currentSelectedcell !== null) {
          this.selectNextCell();
          event.preventDefault();
        }
      }
    });
  }

  selectNextCell() {
    if (this.currentSelectedcell == null) {
      return;
    }
    const currentCell = this.currentSelectedcell.cell;
    // Only data cells carry a col attribute; skip the trailing delete-icon cell.
    const nextCell = currentCell.nextElementSibling?.hasAttribute(field.col)
      ? currentCell.nextElementSibling
      : currentCell.parentElement?.nextElementSibling?.querySelector(
          `td[${field.col}]`
        );
    this.endEditMode(
      currentCell,
      this.currentSelectedcell.rowIndex,
      this.currentSelectedcell.colIndex
    );
    if (nextCell) {
      this.startEditMode(
        nextCell as HTMLElement,
        parseInt(nextCell.getAttribute("row") as string),
        parseInt(nextCell.getAttribute("col") as string)
      );
    }
  }

  init() {
    this.rows = [];
    this.cols = [];
    this.values = new Map<string, string>();
    this.context = new Context();
    this.deletedRows = new Set<number>();
    this.wrongCells = [];
    this.cellIssues = new Map<string, string[]>();
    this.editedCells = new Set<string>();
    this.currentPage = 1;
  }

  onSelectOption(select: any, th: any) {
    if (!isEmpty(select.previousValue)) {
      this.shadow
        .querySelectorAll(`option[value="${CSS.escape(select.previousValue)}"]`)
        .forEach((option: any) => {
          option.disabled = false;
        });
    }

    if (!isEmpty(select.value)) {
      this.values.set(select.id, select.value);
      this.shadow
        .querySelectorAll(`option[value="${CSS.escape(select.value)}"]`)
        .forEach((option: any) => {
          option.disabled = true;
        });
    } else {
      this.values.delete(select.id);
    }

    select.previousValue = select.value;
    this.cols[select.id] = new Option(
      select.options[select.selectedIndex].text,
      select.value
    );
  }

  addOptions(th: any, index: any) {
    const select = createElement(tag.select, {
      id: index,
    });

    select.onchange = () => {
      this.onSelectOption(select, th);
    };

    for (const element of this.options) {
      const option: any = createElement(tag.option, {
        value: element.value,
      });
      option.textContent = element.display_value;
      select.appendChild(option);
    }
    th.appendChild(select);
  }

  generateTableHead(table: any) {
    const thead = table.createTHead();
    const row = thead.insertRow();
    for (const [index, col] of this.fileHeader.entries()) {
      const th = createElement(tag.th);
      const text = createElement(tag.p);
      text.textContent = col;
      th.appendChild(text);
      row.appendChild(th);
      this.addOptions(th, index);
    }
    this.cols = Array(this.fileHeader.length).fill(this.defaultOption);
  }

  markInvalidCell(cell: any, message: any) {
    this.addCellState(cell, invalidCellClassName);
    cell.setAttribute(field.title, message.join("\n"));
  }

  markValidCell(cell: any) {
    if (cell.classList.contains(invalidCellClassName)) {
      this.removeCellState(cell, invalidCellClassName);
    }
    cell.removeAttribute(field.title);
  }

  checkValidity(cell: any, index: any) {
    const rowIndex = Number(cell.getAttribute(field.row));
    this.validateCell(rowIndex, Number(index));
    this.paintCell(cell, rowIndex, Number(index));
  }

  cellKey(rowIndex: number, colIndex: number) {
    return `${rowIndex},${colIndex}`;
  }

  validateCell(rowIndex: number, colIndex: number): string[] {
    const key = this.cellKey(rowIndex, colIndex);
    const value = this.values.get(String(colIndex));
    const option = isEmpty(value)
      ? undefined
      : this.options.find((x) => x.value === value);
    if (option == null || this.deletedRows.has(rowIndex)) {
      this.cellIssues.delete(key);
      return [];
    }
    const { valid, message } = this.checkCell(
      String(this.rows[rowIndex][colIndex] ?? ""),
      option
    );
    if (valid) {
      this.cellIssues.delete(key);
      return [];
    }
    this.cellIssues.set(key, message as string[]);
    return message as string[];
  }

  validateAll() {
    for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
      for (const colIndex of this.values.keys()) {
        this.validateCell(rowIndex, Number(colIndex));
      }
    }
  }

  paintCell(cell: Element, rowIndex: number, colIndex: number) {
    const issues = this.cellIssues.get(this.cellKey(rowIndex, colIndex));
    if (issues) {
      this.markInvalidCell(cell, issues);
    } else {
      this.markValidCell(cell);
    }
  }

  paintRenderedCells() {
    this.shadow.querySelectorAll(`td[${field.col}]`).forEach((cell) => {
      const rowIndex = Number(cell.getAttribute(field.row));
      const colIndex = Number(cell.getAttribute(field.col));
      this.paintCell(cell, rowIndex, colIndex);
      if (this.editedCells.has(this.cellKey(rowIndex, colIndex))) {
        this.addCellState(cell, editedCellClassName);
      }
    });
    for (const wrongCell of this.wrongCells) {
      this.cellsAt(wrongCell).forEach((cell) =>
        this.markInvalidCell(cell, wrongCell.issues)
      );
    }
  }

  errorCount() {
    return this.cellIssues.size;
  }

  updateErrorDisplay() {
    const display = this.shadow.getElementById(ids.errorDisplay);
    const submit = this.shadow.getElementById(
      ids.submitFile
    ) as HTMLButtonElement | null;
    if (!this.settings.validate || !this.context.preSubmitFileContext) {
      if (display) display.style.display = "none";
      if (submit) submit.disabled = false;
      return;
    }
    const count = this.errorCount();
    if (display) {
      display.style.display = "block";
      display.classList.toggle("success", count === 0);
      display.textContent =
        count === 0
          ? this.settings.labels.noErrors
          : this.settings.labels.errorCount.replace("{count}", String(count));
    }
    if (submit) submit.disabled = count > 0;
  }

  removeCellState(cell: any, state: string) {
    cell.classList.remove(state);
    cell.classList.remove(bootstrap[state]);
  }

  addCellState(cell: any, state: string) {
    cell.classList.add(state);
    cell.classList.add(bootstrap[state]);
  }

  endEditMode(cell: any, rowIndex: number, colIndex: number) {
    const input = cell.querySelector(tag.input);
    // Already ended: removing the input below fires blur, which calls us again.
    if (input == null) return;
    const content = input.value;
    this.rows[rowIndex][colIndex] = content;
    cell.innerHTML = "";
    const text = document.createTextNode(this.rows[rowIndex][colIndex]);
    cell.appendChild(text);
    this.addCellState(cell, editedCellClassName);
    this.removeCellState(cell, editableCellClassName);
    this.currentSelectedcell = null;
    this.editedCells.add(this.cellKey(rowIndex, colIndex));
    this.wrongCells = this.wrongCells.filter(
      (wrongCell) =>
        wrongCell.rowIndex !== rowIndex || wrongCell.colIndex !== colIndex
    );
    if (!this.context.preSubmitFileContext) return;
    this.validateCell(rowIndex, colIndex);
    this.paintCell(cell, rowIndex, colIndex);
    this.updateErrorDisplay();
  }

  startEditMode(cell: any, rowIndex: number, colIndex: number) {
    if (cell.classList.contains(editableCellClassName)) return;
    this.currentSelectedcell = new SelectedCell(cell, rowIndex, colIndex);
    this.markValidCell(cell);
    const prevContent = String(this.rows[rowIndex][colIndex] ?? "");
    const input = createElement(
      tag.input,
      { type: "text", value: prevContent },
      ["form-control"],
      {
        blur: () => {
          this.endEditMode(cell, rowIndex, colIndex);
        },
        // Bound to the input, which is discarded on exit, so listeners don't pile up.
        keydown: (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            this.endEditMode(cell, rowIndex, colIndex);
          }
        },
      }
    );
    if (cell.classList.contains(editedCellClassName)) {
      this.removeCellState(cell, editedCellClassName);
    }

    this.addCellState(cell, editableCellClassName);
    cell.innerHTML = "";
    cell.insertBefore(input, cell.firstChild);
    input.focus();
  }

  matchyQuerySelectorAll(pattern: string) {
    return this.shadow.querySelectorAll(pattern);
  }

  matchyQuerySelector(pattern: string) {
    return this.shadow.querySelector(pattern);
  }

  hideRow(row: string) {
    this.shadow.querySelector(`tr[row="${row}"]`)?.remove();
  }

  deleteRow(row: any) {
    this.deletedRows.add(row);
    for (const key of [...this.cellIssues.keys()]) {
      if (key.startsWith(`${row},`)) this.cellIssues.delete(key);
    }
    if (this.settings.pagination.enabled) {
      this.currentPage = Math.min(this.currentPage, this.totalPages());
      this.renderBody();
    } else {
      this.hideRow(row);
    }
    this.updateErrorDisplay();
  }

  generateTableBody(table: any) {
    const tbody = table.tBodies[0] ?? table.createTBody();
    for (const rowIndex of this.pageRowIndexes()) {
      const row = this.rows[rowIndex];
      const tableRow = tbody.insertRow();
      tableRow.setAttribute(field.row, rowIndex);
      for (const colIndex of this.fileHeader.keys()) {
        if (
          this.context.preSubmitFileContext &&
          !this.values.has(String(colIndex))
        ) {
          continue;
        }
        const cell = tableRow.insertCell();
        cell.setAttribute(field.row, rowIndex);
        cell.setAttribute(field.col, colIndex);
        const text = document.createTextNode(row[colIndex]);
        cell.onclick = () => {
          this.startEditMode(cell, rowIndex, colIndex);
        };
        cell.appendChild(text);
      }
      const cell = tableRow.insertCell();
      const icon = createElement(tag.i, {}, [bootstrap["trashIcon"]], {
        click: () => {
          const confirmDelete = confirm(this.settings.labels.confirmDelete);

          if (!!confirmDelete) {
            this.deleteRow(rowIndex);
          }
        },
      });
      cell.appendChild(icon);
    }
  }

  validateFile(file: any) {
    if (!file) {
      alert(this.settings.labels.noFile);
      return false;
    }
    // read-excel-file only parses .xlsx; MIME types are unreliable across OSes,
    // so check the extension too.
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      alert(this.settings.labels.wrongFileType);
      return false;
    }

    return true;
  }

  buildTable() {
    const table = this.shadow.querySelector("table[id='fileContent']");
    if (table == null) {
      return;
    }

    table.innerHTML = "";
    this.currentPage = 1;
    this.generateTableBody(table);
    this.generateTableHead(table);
    if (this.settings.autoMatch) {
      this.autoMatch();
    }
    this.updatePagination();
  }

  handleFileUpload(event: any) {
    const file = event.files[0];
    if (!file) return;

    readXlsxFile(file).then((rows: any) => {
      this.fileHeader = rows[0].map((item: any) => String(item));
      this.rows = rows
        .splice(1)
        .map((row: any) =>
          row.map((cell: any) =>
            cell == null
              ? ""
              : cell instanceof Date
              ? format(cell, "dd/MM/yyyy", { locale: fr })
              : cell
          )
        ) as string[][];

      this.buildTable();
      this.displayElementById(
        this.settings.validate ? ids.preSubmitFile : ids.submitFile
      );
      this.displayElementById(ids.exportFile);
    }).catch((error: unknown) => {
      console.error(error);
      alert(this.settings.labels.unreadableFile);
    });
  }

  uploadFile() {
    this.init();
    this.context.preSubmitFileContext = false;
    this.updateErrorDisplay();
    this.hideElementById(ids.exportFile);
    const fileInput: HTMLInputElement = this.shadow.getElementById(
      ids.uploadedFile
    ) as HTMLInputElement;
    const input = fileInput.files?.[0];
    if (!this.validateFile(input)) {
      return;
    }
    this.handleFileUpload(fileInput);
  }

  setDisplayProp(id: string, prop: string) {
    const elt = this.shadow.getElementById(id);
    if (elt != null) {
      elt.style.display = prop;
    }
  }

  hideElementById(id: string) {
    this.setDisplayProp(id, "none");
  }

  displayElementById(id: any) {
    this.setDisplayProp(id, "inline");
  }

  preSubmitFile() {
    this.context.preSubmitFileContext = true;
    this.deleteNotMatchedColumns();
    this.validateAll();
    this.paintRenderedCells();

    this.hideElementById(ids.preSubmitFile);
    this.displayElementById(ids.resetFile);
    this.displayElementById(ids.submitFile);
    this.updateErrorDisplay();
  }

  deleteNotMatchedColumns() {
    this.shadow.querySelectorAll("th").forEach((th) => {
      const selectId = th.children[1].id;
      if (!this.values.has(selectId)) {
        th.remove();
        this.shadow
          .querySelectorAll(`td[col="${selectId}"]`)
          .forEach((el) => el.remove());
      }
    });
  }

  markWrongCells(wrongCells: WrongCell[]) {
    this.clearWrongCells();
    for (const wrongCell of wrongCells) {
      this.cellsAt(wrongCell).forEach((cell) =>
        this.markInvalidCell(cell, wrongCell.issues)
      );
    }
    this.wrongCells = wrongCells;
  }

  clearWrongCells() {
    for (const wrongCell of this.wrongCells) {
      this.cellsAt(wrongCell).forEach((cell) => this.markValidCell(cell));
    }
    this.wrongCells = [];
  }

  cellsAt({ rowIndex, colIndex }: WrongCell) {
    return this.shadow.querySelectorAll(
      `td[row="${rowIndex}"][col="${colIndex}"]`
    );
  }

  toCsv(): string {
    const columns = this.cols
      .map((col, colIndex) => ({ col, colIndex }))
      .filter(({ col }) => !isEmpty(col.value));
    const escape = (value: unknown) => {
      const text = String(value ?? "");
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = [columns.map(({ col }) => escape(col.display_value)).join(",")];
    for (const [rowIndex, row] of this.rows.entries()) {
      if (this.deletedRows.has(rowIndex)) continue;
      lines.push(columns.map(({ colIndex }) => escape(row[colIndex])).join(","));
    }
    return lines.join("\r\n");
  }

  exportCsv(fileName = `exported_data_${Date.now()}.csv`) {
    if (!this.cols.some((col) => !isEmpty(col.value))) {
      alert(this.settings.labels.noMatchedColumns);
      return;
    }
    const blob = new Blob(["\uFEFF" + this.toCsv()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async submit(data: UploadEntry) {
    console.log("this should be overriden");
  }

  async submitFile() {
    if (
      this.settings.validate &&
      this.context.preSubmitFileContext &&
      this.errorCount() > 0
    ) {
      this.updateErrorDisplay();
      return;
    }
    const data = this.generateResult();
    await this.submit(data);
  }

  generateResult() {
    const content = new UploadEntry();
    for (const [rowIndex, row] of this.rows.entries()) {
      if (this.deletedRows.has(rowIndex)) continue;
      const data: { [key: string]: Cell } = {};
      for (const [colIndex, header] of this.cols.entries()) {
        if (isEmpty(header.value)) continue;

        data[header.value as string] = new Cell(row[colIndex], rowIndex, colIndex);
      }
      content.lines.push(data);
    }
    return content;
  }

  checkCell(cellValue: string, option: Option) {
    if (isEmpty(cellValue)) {
      if (option.mandatory) {
        return { valid: false, message: ["Mandatory field missing"] };
      } else {
        return { valid: true, message: [] };
      }
    }

    const [result, msg] = this.checkType(cellValue, option.type);
    if (!result) {
      return { valid: false, message: [msg] };
    }
    const message = [];
    for (const condition of option.conditions) {
      if (!this.checkConstraint(cellValue, condition)) {
        message.push(this.getInvalidCheckMessage(condition));
      }
    }
    return {
      valid: message.length === 0,
      message,
    };
  }

  getInvalidCheckMessage(condition: Condition) {
    if (!isEmpty(condition.custom_fail_message)) {
      return condition.custom_fail_message;
    } else if (condition.property === ConditionProperty.regex) {
      return `Text doesn't match the regex pattern ${condition.value}`;
    } else if (condition.property === ConditionProperty.length) {
      return `Text length is not ${textPerComparer[condition.comparer]} ${
        condition.value
      }`;
    } else if (condition.property === ConditionProperty.value) {
      return `Value is not ${textPerComparer[condition.comparer]} ${
        condition.value
      }`;
    }
    return "";
  }

  checkConstraint(value: string, condition: Condition) {
    if (condition.property === ConditionProperty.length) {
      if (condition.comparer === Comparer.in) {
        return evaluateConditions[condition.comparer](
          String(value.length),
          condition.value as string[]
        );
      }

      return evaluateConditions[condition.comparer](
        value.length,
        Number(condition.value)
      );
    } else if (condition.property === ConditionProperty.value) {
      if (condition.comparer === Comparer.in) {
        return evaluateConditions[Comparer.in](
          value,
          condition.value as string[]
        );
      }
      return evaluateConditions[condition.comparer](
        Number(value),
        Number(condition.value)
      );
    } else if (condition.property === ConditionProperty.regex) {
      return this.checkRegExpConditions(value, String(condition.value));
    }
  }

  checkRegExpConditions(value: string, conditionValue: string) {
    return evaluateConditions["regExp"](value, conditionValue);
  }

  isValidInteger(value: string): boolean {
    const intValue = parseInt(value, 10);
    return !isNaN(intValue) && value.trim() === intValue.toString();
  }

  isValidFloat(value: string): boolean {
    // parseFloat accepts trailing garbage ("12abc"); Number does not.
    return value.trim() !== "" && Number.isFinite(Number(value));
  }

  checkType(value: string, type: FieldType) {
    if (type === FieldType.integer) {
      return [this.isValidInteger(value), "It's not a valid integer"];
    } else if (type === FieldType.float) {
      return [this.isValidFloat(value), "It's not a valid float"];
    } else if (type === FieldType.bool) {
      return [["Yes", "No"].includes(value), "Possible values are 'Yes' or 'No'"];
    }

    return [true, ""];
  }

  autoMatch() {
    // Nodes are column indexes, not header names, so duplicate headers don't collide.
    const edgesList: [string, string, number][] = [];
    for (const [index, field] of this.fileHeader.entries()) {
      if (field == null) continue;
      for (const option of this.options) {
        const similarity = stringSimilarity.compareTwoStrings(
          field.toLowerCase(),
          option.display_value.toLowerCase()
        );
        if (similarity > 0.1) {
          edgesList.push([String(index), option.value as string, similarity]);
        }
      }
    }

    const matching: { [key: string]: string } = {};
    edgesList.sort((a, b) => (b[2] as any) - (a[2] as any));
    const connectionsA: { [key: string]: string } = {};
    const connectionsB: { [key: string]: string } = {};
    for (const edge of edgesList) {
      const [nodeA, nodeB, weight] = edge;
      if (!connectionsA[nodeA as any] && !connectionsB[nodeB as any]) {
        matching[nodeA] = nodeB;
        connectionsA[nodeA] = nodeB;
        connectionsB[nodeB] = nodeA;
      }
    }

    this.onMatchingFormValueChanged(matching);
  }

  onMatchingFormValueChanged(matching: { [key: string]: string }) {
    for (let index = 0; index < this.fileHeader.length; index++) {
      const match = matching[String(index)];
      if (match) {
        const select = this.shadow.querySelector(
          `select[id="${index}"]`
        ) as HTMLSelectElement;
        // [Raouf][to fix later] I'm not sure if this is the right way to set the value of a select
        select.value = match;
        this.onSelectOption(select, select.parentElement);
      }
    }
  }
}

customElements.define("app-matchy", Matchy);

export default Matchy;
