import { Condition } from "./models/classes/condition";
import { Comparer } from "./models/enums/comparer";
import { ConditonProperty } from "./models/enums/conditon_property";
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

interface Settings {
  validate: boolean;
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
  settings: Settings;
  rows: string[][];
  cols: Option[];
  fileHeader: string[];
  values: Map<string, string>;
  context: Context;
  deletedRows: Set<number>;
  currentSelectedcell: SelectedCell | null = null;

  constructor(
    mainOptions: Option[] = [],
    setting: Settings = { validate: true }
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
    this.settings = setting;

    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `<style>
          table {
            font-size: 12px;
            table-layout: fixed;
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
            padding: 0;
            width: 100%;
            margin: 0;
            outline: none;
            border-top-style: hidden;
            border-right-style: hidden;g
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
    const selectFileLabel = createLabel("Select an Excel File :", {
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
      createButton(
        "Pre Submit",
        {
          id: ids.preSubmitFile,
          type: button.button,
        },
        ["btn", "btn-primary", "mt-2", "m-2"],
        { click: () => this.preSubmitFile() }
      )
    );
    form.appendChild(
      createButton(
        "Submit",
        {
          id: ids.submitFile,
          type: button.button,
        },
        ["btn", "btn-success", "mt-2", "m-2"],
        { click: () => this.submitFile() }
      )
    );
    form.appendChild(
      createButton(
        "Reset",
        {
          id: ids.resetFile,
          type: button.button,
        },
        ["btn", "btn-success", "mt-2", "m-2"],
        {
          click: () => {
            this.uploadFile();
            this.hideElementById(ids.resetFile);
            this.hideElementById(ids.submitFile);
          },
        }
      )
    );
    container.appendChild(form);
    this.shadow.appendChild(container);
    const table = createElement(tag.table, { id: ids.fileContent }, [
      bootstrap["table"],
      "table-hover",
      "table-striped",
    ]);
    this.shadow.appendChild(table);
    this.hideElementById(ids.preSubmitFile);
    this.hideElementById(ids.submitFile);
    this.hideElementById(ids.resetFile);
    this.initEventListeners();
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
    let nextCell = null;
    if (currentCell.nextElementSibling) {
      nextCell = currentCell.nextElementSibling;
    } else if (currentCell.parentElement?.nextElementSibling) {
      nextCell = currentCell.parentElement?.nextElementSibling.children[0];
    }
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
  }

  onSelectOption(select: any, th: any) {
    if (!isEmpty(select.previousValue)) {
      this.shadow
        .querySelectorAll(`option[value="${select.previousValue}"]`)
        .forEach((option: any) => {
          option.disabled = false;
        });
    }

    if (!isEmpty(select.value)) {
      this.values.set(select.id, select.value);
      this.shadow
        .querySelectorAll(`option[value="${select.value}"]`)
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
      option.innerText = element.display_value;
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
      text.innerHTML = col;
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
    const value = this.values.get(String(index));
    if (isEmpty(value)) return;
    const option = this.options.find((x) => x.value === value);
    if (option == null) return;
    const { valid, message } = this.checkCell(cell.innerText, option);
    if (!valid) {
      this.markInvalidCell(cell, message);
    } else {
      this.markValidCell(cell);
    }
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
    const content = input.value;
    this.rows[rowIndex][colIndex] = content;
    cell.innerHTML = "";
    const text = document.createTextNode(this.rows[rowIndex][colIndex]);
    cell.appendChild(text);
    this.addCellState(cell, editedCellClassName);
    this.removeCellState(cell, editableCellClassName);
    this.currentSelectedcell = null;
    if (!this.context.preSubmitFileContext) return;
    this.checkValidity(cell, colIndex);
  }

  startEditMode(cell: any, rowIndex: number, colIndex: number) {
    if (cell.classList.contains(editableCellClassName)) retutabrn;
    this.currentSelectedcell = new SelectedCell(cell, rowIndex, colIndex);
    this.markValidCell(cell);
    const prevContent = cell.innerText;
    const input = createElement(
      tag.input,
      { type: "text", value: prevContent },
      ["form-control"],
      {
        blur: () => {
          this.endEditMode(cell, rowIndex, colIndex);
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
    cell.addEventListener("keypress", (e: any) => {
      if (e.key === "Enter") {
        this.endEditMode(cell, rowIndex, colIndex);
      }
    });
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
    this.hideRow(row);
  }

  generateTableBody(table: any) {
    for (const [rowIndex, row] of this.rows.entries()) {
      if (this.deletedRows.has(rowIndex)) {
        continue;
      }
      const tableRow = table.insertRow();
      tableRow.setAttribute(field.row, rowIndex);
      for (const [colIndex, col] of this.fileHeader.entries()) {
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
          const confirmDelete = confirm(
            "Are you sure you want to delete this item ?"
          );

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
      alert("Please select a file.");
      return false;
    }
    if (
      ![
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ].includes(file.type)
    ) {
      alert("Please select an Excel file.");
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
    this.generateTableBody(table);
    this.generateTableHead(table);
    this.autoMatch();
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
    });
  }

  uploadFile() {
    this.init();
    this.context.preSubmitFileContext = false;
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

  generateValues() {
    this.shadow.querySelectorAll("th div:not([data-selected='null'])").forEach((div) => {
        const selectId = div.id;
        const selectedValue = div.getAttribute("data-selected")
        if (selectedValue != null) {
            this.values.set(selectId.toString(), selectedValue)
        }
    });
}

  preSubmitFile() {
    this.generateValues();
    this.context.preSubmitFileContext = true;
    this.deleteNotMatchedColumns();
    for (let colIndex = 0; colIndex < this.cols.length; colIndex++) {
      if (!this.values.has(String(colIndex))) continue;

      this.shadow.querySelectorAll(`tr td[col="${colIndex}"]`).forEach((td) => {
        this.checkValidity(td, colIndex);
      });
    }

    this.hideElementById(ids.preSubmitFile);
    this.displayElementById(ids.resetFile);
    this.displayElementById(ids.submitFile);
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

  async submit(data: any) {
    console.log("this should be overriden");
  }

  async submitFile() {
    const data = this.generateResult();
    await this.submit(data);
  }

  generateResult() {
    const content = new UploadEntry();
    for (const [rowIndex, row] of this.rows.entries()) {
      if (this.deletedRows.has(rowIndex)) continue;
      const data: { [key: string]: Cell } = {};
      for (const [colIndex, header] of this.cols.entries()) {
        if (header.value == null) continue;

        data[header.value] = new Cell(row[colIndex], rowIndex, colIndex);
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
    } else if (condition.property === ConditonProperty.regex) {
      return `Text doesn't match the regex pattern ${condition.value}`;
    } else if (condition.property === ConditonProperty.length) {
      return `Text length is not ${textPerComparer[condition.comparer]} ${
        condition.value
      }`;
    } else if (condition.property === ConditonProperty.value) {
      return `Value is not ${textPerComparer[condition.comparer]} ${
        condition.value
      }`;
    }
    return "";
  }

  checkConstraint(value: string, condition: Condition) {
    if (condition.property === ConditonProperty.length) {
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
    } else if (condition.property === ConditonProperty.value) {
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
    } else if (condition.property === ConditonProperty.regex) {
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
    return !isNaN(parseFloat(value));
  }

  checkType(value: string, type: FieldType) {
    if (type === FieldType.integer) {
      return [this.isValidInteger(value), "It's not a valid integer"];
    } else if (type === FieldType.float) {
      return [this.isValidFloat(value), "It's not a valid float"];
    } else if (type === FieldType.bool) {
      return [value in ["Yes", "No"], "Possible values are 'Yes' or 'No'"];
    }

    return [true, ""];
  }

  autoMatch() {
    const edgesList: [string, string, number][] = [];
    for (const field of this.fileHeader) {
      if (field == null) continue;
      for (const option of this.options) {
        const similarity = stringSimilarity.compareTwoStrings(
          field.toLowerCase(),
          option.display_value.toLowerCase()
        );
        if (similarity > 0.1) {
          edgesList.push([field, option.value as string, similarity]);
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
      const field = this.fileHeader[index];
      const match = matching[field];
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
