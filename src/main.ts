import { Condition } from './models/classes/condition';
import { Comparer } from './models/enums/comparer';
import { ConditonProperty } from './models/enums/conditon_property';
import { FieldType } from './models/enums/field_type';
import { Option } from './models/classes/option';
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
} from './modules/common';
import { Context } from './models/classes/context';
import { Cell } from './models/classes/cell';
import { UploadEntry } from './models/classes/uploadEntry';

const editableCellClassName = 'editableCell';
const editedCellClassName = 'editedCell';
const invalidCellClassName = 'invalidCell';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import readXlsxFile from 'read-excel-file';
import * as stringSimilarity from 'string-similarity';
import * as Papa from 'papaparse';

export interface MatchyButtonConfig {
  text?: string;
  className?: string;
  style?: string;
}

export interface MatchyConfig {
  buttons?: {
    upload?: MatchyButtonConfig;
    validate?: MatchyButtonConfig;
    submit?: MatchyButtonConfig;
    reset?: MatchyButtonConfig;
    export?: MatchyButtonConfig;
  };
  autoMap?: boolean;
  pagination?: {
    enabled?: boolean;
    itemsPerPage?: number;
  };
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
  rows: string[][];
  cols: Option[];
  fileHeader: string[];
  values: Map<string, string>;
  context: Context;
  deletedRows: Set<number>;
  config: MatchyConfig;
  currentPage: number;
  itemsPerPage: number;
  currentSelectedcell: SelectedCell | null = null;
  autoMappingDone: boolean = false;
  isResizing: boolean = false;
  currentResizeColumn: number | null = null;
  startX: number = 0;
  startWidth: number = 0;
  columnWidths: number[] = [];

  constructor(mainOptions: Option[] = [], config: MatchyConfig = {}) {
    super();
    this.defaultOption = new Option();
    this.options = [];
    this.rows = [];
    this.cols = [];
    this.fileHeader = [];
    this.values = new Map<string, string>();
    this.context = new Context();
    this.deletedRows = new Set<number>();
    this.config = { 
      autoMap: true, 
      pagination: { enabled: true, itemsPerPage: 20 },
      ...config 
    };
    this.currentPage = 1;
    this.itemsPerPage = this.config.pagination?.itemsPerPage || 20;
    this.setPossibleOptions(mainOptions);

    this.shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
          /* Main container spacing */
          .container {
            padding: 1.5rem;
            max-width: 100%;
          }

          /* Form styling with proper spacing */
          form {
            background: #ffffff;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .form-group {
            margin-bottom: 1.25rem;
          }

          /* Label styling */
          label {
            display: block;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 0.5rem;
            font-size: 0.95rem;
          }

          /* File input styling */
          .form-control {
            padding: 0.625rem 0.875rem;
            border: 2px solid #e1e8ed;
            border-radius: 6px;
            font-size: 0.95rem;
            transition: all 0.2s ease;
          }

          .form-control:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
          }

          /* Button group spacing */
          .btn {
            padding: 0.625rem 1.25rem;
            margin-right: 0.75rem;
            margin-top: 0.5rem;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-block;
          }

          .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .btn:active {
            transform: translateY(0);
          }

          .btn-primary {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
          }

          .btn-primary:hover {
            background: linear-gradient(135deg, #2980b9 0%, #21618c 100%);
          }

          .btn-success {
            background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
            color: white;
          }

          .btn-success:hover {
            background: linear-gradient(135deg, #229954 0%, #1e8449 100%);
          }

          .btn-secondary {
            background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
            color: white;
          }

          .btn-secondary:hover {
            background: linear-gradient(135deg, #7f8c8d 0%, #6c7a7b 100%);
          }

          .btn-info {
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
            color: white;
          }

          .btn-info:hover {
            background: linear-gradient(135deg, #138496 0%, #0f6674 100%);
          }

          /* Button group container */
          .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-top: 1rem;
          }

          /* Table styling with improved spacing */
          table {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
            margin: 2rem 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            table-layout: fixed;
          }

          th {
            background: #ffffff;
            color: #2c3e50;
            text-align: left;
            padding: 1rem 1.25rem;
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 3px solid #e1e8ed;
            position: relative;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* Column resize handle */
          .resize-handle {
            position: absolute;
            top: 0;
            right: 0;
            width: 5px;
            height: 100%;
            cursor: col-resize;
            background: transparent;
            z-index: 10;
          }

          .resize-handle:hover {
            background: #3498db;
            opacity: 0.5;
          }

          .resize-handle.resizing {
            background: #3498db;
            opacity: 0.8;
          }

          th p {
            margin: 0 0 0.5rem 0;
            font-size: 0.85rem;
            opacity: 0.8;
          }

          th select {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: #f9fafb;
            color: #2c3e50;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          th select:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
          }

          td {
            padding: 0.875rem 1.25rem;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
            color: #2c3e50;
            font-size: 0.9rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          tr:hover {
            background-color: #f8f9fa;
            transition: background-color 0.2s ease;
          }

          tr:last-child td {
            border-bottom: none;
          }

          /* Editable cell styling */
          .editableCell {
            padding: 0;
            border: none;
            border-spacing: 0;
            background-color: #fff3cd;
            position: relative;
          }

          .editableCell::after {
            content: '✎';
            position: absolute;
            right: 0.5rem;
            top: 50%;
            transform: translateY(-50%);
            color: #856404;
            font-size: 0.875rem;
          }

          .editableCell input {
            padding: 0.875rem 1.25rem;
            width: 100%;
            margin: 0;
            outline: none;
            border: 2px solid #ffc107;
            background-color: #fff3cd;
            color: #2c3e50;
            font-size: 0.9rem;
          }

          .editableCell input:focus {
            background-color: #ffffff;
            border-color: #ff9800;
          }

          /* Edited cell styling */
          .editedCell {
            background-color: #d4edda;
            border-left: 3px solid #28a745;
          }

          /* Invalid cell styling */
          .invalidCell {
            background-color: #f8d7da;
            border-left: 3px solid #dc3545;
            color: #721c24;
            position: relative;
            font-weight: 500;
          }

          .invalidCell::before {
            content: '⚠';
            position: absolute;
            left: 0.5rem;
            top: 50%;
            transform: translateY(-50%);
            color: #dc3545;
            font-size: 1rem;
            font-weight: bold;
          }

          /* Delete icon styling */
          .delete_icon {
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            background: #fee;
            color: #dc3545;
            font-weight: bold;
            font-size: 1.25rem;
            transition: all 0.2s ease;
          }

          .delete_icon:hover {
            background: #dc3545;
            color: white;
            transform: scale(1.1);
          }

          .delete_icon:before {
            content: "×";
          }

          /* Loading state */
          .loading {
            opacity: 0.6;
            pointer-events: none;
            position: relative;
          }

          .loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Success/Error messages */
          .alert {
            padding: 1rem 1.25rem;
            margin: 1rem 0;
            border-radius: 6px;
            font-size: 0.95rem;
          }

          .alert-success {
            background: #d4edda;
            border-left: 4px solid #28a745;
            color: #155724;
          }

          .alert-error {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            color: #721c24;
          }

          .alert-warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            color: #856404;
          }

          /* Smooth transitions */
          * {
            transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
          }

          /* Table cell cursor */
          td:not(:last-child) {
            cursor: pointer;
          }

          /* Hover effect for editable cells */
          td:not(:last-child):hover {
            background-color: #e8f4f8;
            outline: 2px solid #3498db;
            outline-offset: -2px;
          }

          /* Pagination controls */
          .pagination-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
            margin-top: 1rem;
          }

          .pagination-info {
            color: #6b7280;
            font-size: 0.9rem;
          }

          .pagination-controls {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }

          .pagination-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #d1d5db;
            background: white;
            color: #374151;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s ease;
          }

          .pagination-btn:hover:not(:disabled) {
            background: #f3f4f6;
            border-color: #9ca3af;
          }

          .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .pagination-page {
            padding: 0.5rem 1rem;
            color: #374151;
            font-size: 0.875rem;
            font-weight: 500;
          }

          .error-display {
            margin: 1.5rem 0;
            padding: 1rem 1.5rem;
            background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
            border-left: 4px solid #e74c3c;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
          }
          
          .error-display.success {
            background: linear-gradient(135deg, #f0fff4 0%, #e6f9ed 100%);
            border-left-color: #27ae60;
            box-shadow: 0 2px 8px rgba(39, 174, 96, 0.1);
          }
          
          .error-count {
            font-size: 1.1rem;
            font-weight: 600;
            color: #e74c3c;
            margin-bottom: 0.5rem;
          }
          
          .error-display.success .error-count {
            color: #27ae60;
          }
          
          .error-message {
            font-size: 0.95rem;
            color: #555;
            line-height: 1.5;
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .container {
              padding: 1rem;
            }

            form {
              padding: 1rem;
            }

            .button-group {
              flex-direction: column;
            }

            .btn {
              width: 100%;
              margin-right: 0;
            }

            table {
              font-size: 0.85rem;
            }

            th, td {
              padding: 0.625rem 0.75rem;
            }
          }

        `;
    this.shadow.appendChild(style);

    importExternalUi(this.shadow);
    this.initializeComponent();
    this.init();
  }

  setPossibleOptions(options: Option[]) {
    this.defaultOption = new Option();
    this.options = [this.defaultOption, ...options];
  }

  initializeComponent() {
    const container = createElement(tag.div, {}, [bootstrap.container]);
    const form = createElement(tag.form);
    
    const formGroup = createElement(tag.div, {}, [bootstrap.formGroup]);
    const selecCsvLabel = createLabel('Select CSV or Excel File', {
      for: ids.csvFile,
    });
    const fileInput = createElement(
      tag.input,
      {
        type: 'file',
        id: ids.csvFile,
        name: 'csvFile',
        accept: '.csv,.xlsx,.xls',
      },
      ['form-control']
    );
    
    fileInput.addEventListener('change', (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        this.enableButton(ids.uploadFile);
      } else {
        this.disableButton(ids.uploadFile);
      }
    });
    
    formGroup.appendChild(selecCsvLabel);
    formGroup.appendChild(fileInput);
    form.appendChild(formGroup);
    
    const buttonGroup = createElement(tag.div, {}, ['button-group']);
    
    const uploadBtn = this.createCustomButton(
      this.config.buttons?.upload?.text || 'Upload',
      ids.uploadFile,
      this.config.buttons?.upload?.className || 'btn btn-primary',
      this.config.buttons?.upload?.style,
      () => this.uploadFile()
    );
    buttonGroup.appendChild(uploadBtn);
    
    const validateBtn = this.createCustomButton(
      this.config.buttons?.validate?.text || 'Validate',
      ids.preSubmitFile,
      this.config.buttons?.validate?.className || 'btn btn-primary',
      this.config.buttons?.validate?.style,
      () => this.preSubmitFile()
    );
    buttonGroup.appendChild(validateBtn);
    
    const submitBtn = this.createCustomButton(
      this.config.buttons?.submit?.text || 'Submit',
      ids.submitFile,
      this.config.buttons?.submit?.className || 'btn btn-success',
      this.config.buttons?.submit?.style,
      () => this.submitFile()
    );
    buttonGroup.appendChild(submitBtn);
    
    const resetBtn = this.createCustomButton(
      this.config.buttons?.reset?.text || 'Reset',
      ids.resetFile,
      this.config.buttons?.reset?.className || 'btn btn-secondary',
      this.config.buttons?.reset?.style,
      () => {
        this.resetData();
      }
    );
    buttonGroup.appendChild(resetBtn);
    
    const exportBtn = this.createCustomButton(
      this.config.buttons?.export?.text || 'Export CSV',
      ids.exportFile,
      this.config.buttons?.export?.className || 'btn btn-info',
      this.config.buttons?.export?.style,
      () => this.exportToCSV()
    );
    buttonGroup.appendChild(exportBtn);
    
    form.appendChild(buttonGroup);
    
    container.appendChild(form);
    
    const errorDisplay = createElement(tag.div, { id: ids.errorDisplay }, ['error-display']);
    errorDisplay.style.display = 'none';
    container.appendChild(errorDisplay);
    
    this.shadow.appendChild(container);
    
    const table = createElement(tag.table, { id: ids.csvContent }, [
      bootstrap.table,
      'table-hover',
      'table-striped',
    ]);
    this.shadow.appendChild(table);
    
    if (this.config.pagination?.enabled !== false) {
      const paginationContainer = createElement(tag.div, { id: 'paginationContainer' }, ['pagination-container']);
      paginationContainer.style.display = 'none';
      this.shadow.appendChild(paginationContainer);
    }
    
    this.disableButton(ids.uploadFile);
    this.hideElementById(ids.preSubmitFile);
    this.hideElementById(ids.submitFile);
    this.hideElementById(ids.resetFile);
    this.hideElementById(ids.exportFile);
    this.initEventListeners();
  }

  initEventListeners() {
    this.addEventListener('keydown', (event) => {
      // Check if the pressed key is Tab
      if (event.key === 'Tab') {
        if (this.currentSelectedcell !== null) {
          this.selectNextCell();
          event.preventDefault();
        }
      }
    });
    
    // Column resize listeners
    document.addEventListener('mousemove', (e: MouseEvent) => {
      this.doResize(e);
    });
    
    document.addEventListener('mouseup', () => {
      this.stopResize();
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
        parseInt(nextCell.getAttribute('row') as string),
        parseInt(nextCell.getAttribute('col') as string)
      );
    }
  }

  calculateColumnWidths() {
    this.columnWidths = [];
    const minWidth = 150; // Minimum column width in pixels
    const padding = 40; // Padding for cell content
    const charWidth = 8; // Approximate character width in pixels

    for (let colIndex = 0; colIndex < this.fileHeader.length; colIndex++) {
      let maxLength = this.fileHeader[colIndex].length;
      
      // Check all rows for the longest content in this column
      for (const row of this.rows) {
        if (row[colIndex] && row[colIndex].length > maxLength) {
          maxLength = row[colIndex].length;
        }
      }
      
      // Calculate width based on content, with min and max limits
      const calculatedWidth = Math.max(minWidth, Math.min(maxLength * charWidth + padding, 500));
      this.columnWidths.push(calculatedWidth);
    }
  }

  startResize(event: MouseEvent, columnIndex: number, th: HTMLElement) {
    this.isResizing = true;
    this.currentResizeColumn = columnIndex;
    this.startX = event.pageX;
    this.startWidth = th.offsetWidth;
    
    // Add resizing class to handle
    const handle = th.querySelector('.resize-handle');
    if (handle) {
      handle.classList.add('resizing');
    }
    
    event.preventDefault();
    event.stopPropagation();
  }

  doResize(event: MouseEvent) {
    if (!this.isResizing || this.currentResizeColumn === null) {
      return;
    }

    const columnIndex = this.currentResizeColumn;
    const diff = event.pageX - this.startX;
    const newWidth = Math.max(50, this.startWidth + diff); // Minimum 50px
    
    this.columnWidths[columnIndex] = newWidth;
    
    const table = this.shadow.querySelector("table[id='csvContent']");
    if (table) {
      const thead = table.querySelector('thead');
      const tbody = table.querySelector('tbody');
      
      if (thead) {
        const headerCells = thead.querySelectorAll('th');
        if (headerCells[columnIndex]) {
          (headerCells[columnIndex] as HTMLElement).style.width = `${newWidth}px`;
        }
      }
      
      if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells[columnIndex]) {
            (cells[columnIndex] as HTMLElement).style.width = `${newWidth}px`;
          }
        });
      }
    }
  }

  stopResize() {
    if (this.isResizing) {
      // Remove resizing class from all handles
      const handles = this.shadow.querySelectorAll('.resize-handle.resizing');
      handles.forEach((handle) => {
        handle.classList.remove('resizing');
      });
    }
    
    this.isResizing = false;
    this.currentResizeColumn = null;
  }

  init() {
    this.rows = [];
    this.cols = [];
    this.values = new Map<string, string>();
    this.context = new Context();
    this.deletedRows = new Set<number>();
    this.currentPage = 1;
    this.autoMappingDone = false;
    this.columnWidths = [];
  }

  resetData() {
    const fileInput: any = this.shadow.getElementById(ids.csvFile);
    if (fileInput) {
      fileInput.value = '';
    }
    
    this.init();
    this.context.preSubmitFileContext = false;
    
    const paginationContainer = this.shadow.getElementById('paginationContainer');
    if (paginationContainer) {
      paginationContainer.style.display = 'none';
    }
    
    const errorDisplay = this.shadow.getElementById(ids.errorDisplay);
    if (errorDisplay) {
      errorDisplay.style.display = 'none';
    }
    
    const table = this.shadow.querySelector("table[id='csvContent']");
    if (table) {
      while (table.firstChild) {
        table.removeChild(table.firstChild);
      }
    }
    
    this.disableButton(ids.uploadFile);
    this.hideElementById(ids.preSubmitFile);
    this.hideElementById(ids.submitFile);
    this.hideElementById(ids.resetFile);
    this.hideElementById(ids.exportFile);
  }

  enableButton(id: string) {
    const btn = this.shadow.getElementById(id);
    if (btn) {
      btn.removeAttribute('disabled');
    }
  }

  disableButton(id: string) {
    const btn = this.shadow.getElementById(id);
    if (btn) {
      btn.setAttribute('disabled', 'true');
    }
  }

  checkRequiredFieldsMapped(): boolean {
    for (const option of this.options) {
      if (option.mandatory && option.value) {
        let found = false;
        for (const [key, value] of this.values.entries()) {
          if (value === option.value) {
            found = true;
            break;
          }
        }
        if (!found) {
          return false;
        }
      }
    }
    return true;
  }

  updateButtonStates() {
    if (this.rows.length > 0) {
      this.displayElementById(ids.resetFile);
      this.displayElementById(ids.exportFile);
      this.enableButton(ids.exportFile);
      
      if (this.checkRequiredFieldsMapped()) {
        this.displayElementById(ids.preSubmitFile);
        this.enableButton(ids.preSubmitFile);
      } else {
        this.displayElementById(ids.preSubmitFile);
        this.disableButton(ids.preSubmitFile);
      }
      
      if (!this.context.preSubmitFileContext) {
        this.hideElementById(ids.submitFile);
      }
    } else {
      this.hideElementById(ids.preSubmitFile);
      this.hideElementById(ids.submitFile);
      this.hideElementById(ids.resetFile);
      this.hideElementById(ids.exportFile);
    }
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
    this.updateButtonStates();
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
      if (element.value === null || element.value === '') {
        option.innerText = '-- Select mapping --';
      }
      select.appendChild(option);
    }
    th.appendChild(select);
  }

  generateTableHead(table: any) {
    const thead = table.createTHead();
    const row = thead.insertRow();
    for (const [index, col] of this.fileHeader.entries()) {
      const th = createElement(tag.th);
      
      if (this.columnWidths[index]) {
        th.style.width = `${this.columnWidths[index]}px`;
      }
      
      const text = createElement(tag.p);
      // Use textContent instead of innerHTML to prevent XSS
      text.textContent = col;
      th.appendChild(text);
      this.addOptions(th, index);
      
      const resizeHandle = createElement(tag.div, {}, ['resize-handle']);
      resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
        this.startResize(e, index, th);
      });
      th.appendChild(resizeHandle);
      
      row.appendChild(th);
    }
    this.cols = Array(this.fileHeader.length).fill(this.defaultOption);
  }

  markInvalidCell(cell: any, message: any) {
    this.addCellState(cell, invalidCellClassName);
    cell.setAttribute(field.title, message.join('\n'));
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
    const option = this.options.find(x => x.value === value);
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
    cell.classList.remove((bootstrap as any)[state]);
  }

  addCellState(cell: any, state: string) {
    cell.classList.add(state);
    cell.classList.add((bootstrap as any)[state]);
  }

  endEditMode(cell: any, rowIndex: number, colIndex: number) {
    const input = cell.querySelector(tag.input);
    const content = input.value;
    this.rows[rowIndex][colIndex] = content;
    // Use safe DOM manipulation instead of innerHTML
    while (cell.firstChild) {
      cell.removeChild(cell.firstChild);
    }
    const text = document.createTextNode(this.rows[rowIndex][colIndex]);
    cell.appendChild(text);
    this.addCellState(cell, editedCellClassName);
    this.removeCellState(cell, editableCellClassName);
    this.currentSelectedcell = null;
    if (!this.context.preSubmitFileContext) return;
    this.checkValidity(cell, colIndex);
    this.updateErrorDisplay();
  }

  startEditMode(cell: any, rowIndex: number, colIndex: number) {
    if (cell.classList.contains(editableCellClassName)) return;
    this.currentSelectedcell = new SelectedCell(cell, rowIndex, colIndex);
    this.markValidCell(cell);
    const prevContent = cell.innerText;
    const input = createElement(
      tag.input,
      { type: 'text', value: prevContent },
      ['form-control'],
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
    // Use safe DOM manipulation instead of innerHTML
    while (cell.firstChild) {
      cell.removeChild(cell.firstChild);
    }
    cell.insertBefore(input, cell.firstChild);
    input.focus();
    cell.addEventListener('keypress', (e: any) => {
      if (e.key === 'Enter') {
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
    this.buildTable();
  }

  generateTableBody(table: any) {
    const paginationEnabled = this.config.pagination?.enabled !== false;
    const startIndex = paginationEnabled ? (this.currentPage - 1) * this.itemsPerPage : 0;
    const endIndex = paginationEnabled ? startIndex + this.itemsPerPage : this.rows.length;
    
    let displayedCount = 0;
    
    for (const [rowIndex, row] of this.rows.entries()) {
      if (this.deletedRows.has(rowIndex)) {
        continue;
      }
      if (paginationEnabled && (displayedCount < startIndex || displayedCount >= endIndex)) {
        displayedCount++;
        continue;
      }
      
      displayedCount++;
      
      const tableRow = table.insertRow();
      tableRow.setAttribute(field.row, rowIndex);
      
      for (const [colIndex, col] of this.fileHeader.entries()) {
        const cell = tableRow.insertCell();
        cell.setAttribute(field.row, rowIndex);
        cell.setAttribute(field.col, colIndex);
        cell.setAttribute(field.title, 'Click to edit');
        
        if (this.columnWidths[colIndex]) {
          cell.style.width = `${this.columnWidths[colIndex]}px`;
        }
        
        const text = document.createTextNode(row[colIndex]);
        cell.onclick = () => {
          this.startEditMode(cell, rowIndex, colIndex);
        };
        cell.appendChild(text);
      }
      
      const cell = tableRow.insertCell();
      cell.style.textAlign = 'center';
      const icon = createElement(tag.i, {}, [bootstrap.trashIcon], {
        click: () => {
          const confirmDelete = confirm(
            'Are you sure you want to delete this row?\n\nThis action cannot be undone.'
          );

          if (confirmDelete) {
            this.deleteRow(rowIndex);
          }
        },
      });
      cell.appendChild(icon);
    }
    
    if (paginationEnabled) {
      this.updatePaginationControls();
    }
  }

  validateFile(file: any) {
    if (!file) {
      alert('Please select a file.\n\nChoose a CSV or Excel file to upload.');
      return false;
    }
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type!\n\nPlease select a CSV or Excel file (.csv, .xlsx, or .xls extension).');
      return false;
    }

    return true;
  }

  isExcelFile(file: File): boolean {
    return [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ].includes(file.type);
  }

  handleExcelUpload(file: File) {
    readXlsxFile(file).then((rows: any) => {
      this.fileHeader = rows[0].map((item: any) => String(item));
      this.rows = rows
        .splice(1)
        .map((row: any) =>
          row.map((cell: any) =>
            cell == null
              ? ''
              : cell instanceof Date
              ? format(cell, 'dd/MM/yyyy', { locale: fr })
              : String(cell)
          )
        ) as string[][];

      this.buildTable();
      
      if (this.config.pagination?.enabled !== false) {
        const paginationContainer = this.shadow.getElementById('paginationContainer');
        if (paginationContainer) {
          paginationContainer.style.display = 'flex';
        }
      }
      
      this.updateButtonStates();
    });
  }

  handleCsvUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const csv = reader.result;
      if (csv == null) return;
      Papa.parse(csv as any, {
        delimiter: ',',
        complete: (results: any) => {
          const lines = results.data;
          this.fileHeader = lines[0].map((x: any) => x.trim());
          for (const values of lines.splice(1, lines.length - 1)) {
            const vals = values.map((x: any) => x.trim());
            const uniqueVals = new Set(vals);
            if (
              uniqueVals.size === 1 &&
              uniqueVals.values().next().value === ''
            )
              continue;

            this.rows.push(vals);
          }
          this.buildTable();
          
          if (this.config.pagination?.enabled !== false) {
            const paginationContainer = this.shadow.getElementById('paginationContainer');
            if (paginationContainer) {
              paginationContainer.style.display = 'flex';
            }
          }
          
          this.updateButtonStates();
        },
        error: function (error: any) {
          console.error(error.message);
        },
      });
    };
    reader.readAsText(file);
  }

  buildTable() {
    const table = this.shadow.querySelector("table[id='csvContent']");
    if (table == null) {
      return;
    }

    this.calculateColumnWidths();

    while (table.firstChild) {
      table.removeChild(table.firstChild);
    }
    this.generateTableBody(table);
    this.generateTableHead(table);
    if (this.config.autoMap && !this.autoMappingDone) {
      this.autoMatch();
      this.autoMappingDone = true;
    }
  }

  uploadFile() {
    this.init();
    this.context.preSubmitFileContext = false;
    const fileInput: HTMLInputElement = this.shadow.getElementById(
      ids.csvFile
    ) as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!this.validateFile(file)) {
      return;
    }
    
    if (this.isExcelFile(file!)) {
      this.handleExcelUpload(file!);
    } else {
      this.handleCsvUpload(file!);
    }
  }

  setDisplayProp(id: string, prop: string) {
    const elt = this.shadow.getElementById(id);
    if (elt != null) {
      elt.style.display = prop;
    }
  }

  hideElementById(id: string) {
    this.setDisplayProp(id, 'none');
  }

  displayElementById(id: string) {
    this.setDisplayProp(id, 'inline');
  }

  getTotalPages(): number {
    const activeRows = this.rows.length - this.deletedRows.size;
    return Math.ceil(activeRows / this.itemsPerPage);
  }

  goToPage(page: number) {
    const totalPages = this.getTotalPages();
    if (page < 1 || page > totalPages) return;
    
    this.currentPage = page;
    this.buildTable();
  }

  updatePaginationControls() {
    const paginationContainer = this.shadow.getElementById('paginationContainer');
    if (!paginationContainer) return;
    
    const totalPages = this.getTotalPages();
    const activeRows = this.rows.length - this.deletedRows.size;
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, activeRows);
    
    // Clear existing content
    while (paginationContainer.firstChild) {
      paginationContainer.removeChild(paginationContainer.firstChild);
    }
    
    const infoDiv = createElement(tag.div, {}, ['pagination-info']);
    infoDiv.textContent = `Showing ${startItem}-${endItem} of ${activeRows} rows`;
    paginationContainer.appendChild(infoDiv);
    
    const controlsDiv = createElement(tag.div, {}, ['pagination-controls']);
    
    const prevBtn = createButton(
      'Previous',
      { type: button.button },
      ['pagination-btn'],
      { click: () => this.goToPage(this.currentPage - 1) }
    );
    if (this.currentPage === 1) {
      prevBtn.setAttribute('disabled', 'true');
    }
    controlsDiv.appendChild(prevBtn);
    
    const pageInfo = createElement(tag.span, {}, ['pagination-page']);
    pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    controlsDiv.appendChild(pageInfo);
    
    const nextBtn = createButton(
      'Next',
      { type: button.button },
      ['pagination-btn'],
      { click: () => this.goToPage(this.currentPage + 1) }
    );
    if (this.currentPage === totalPages) {
      nextBtn.setAttribute('disabled', 'true');
    }
    controlsDiv.appendChild(nextBtn);
    
    paginationContainer.appendChild(controlsDiv);
  }

  createCustomButton(
    text: string,
    id: string,
    className: string,
    style: string | undefined,
    onClick: () => void
  ) {
    const btn = createButton(
      text,
      { id, type: button.button },
      className.split(' '),
      { click: onClick }
    );
    if (style) {
      btn.setAttribute('style', style);
    }
    return btn;
  }


  preSubmitFile() {
    this.context.preSubmitFileContext = true;
    this.deleteNotMatchedRows();
    
    for (let colIndex = 0; colIndex < this.cols.length; colIndex++) {
      if (!this.values.has(String(colIndex))) continue;

      this.shadow.querySelectorAll(`tr td[col="${colIndex}"]`).forEach(td => {
        this.checkValidity(td, colIndex);
      });
    }

    this.updateErrorDisplay();
    
    this.disableButton(ids.preSubmitFile);
    this.displayElementById(ids.submitFile);
  }

  deleteNotMatchedRows() {
    this.shadow.querySelectorAll('th').forEach(th => {
      const selectId = th.children[1].id;
      if (!this.values.has(selectId)) {
        th.remove();
        this.shadow
          .querySelectorAll(`td[col="${selectId}"]`)
          .forEach(el => el.remove());
      }
    });
  }

  async submit(data: any) {
    console.log('this should be overriden');
  }

  exportToCSV() {
    const headers: string[] = [];
    const headerMapping: number[] = [];
    
    for (let colIndex = 0; colIndex < this.cols.length; colIndex++) {
      const col = this.cols[colIndex];
      if (col.value != null && col.value !== '') {
        headers.push(col.display_value);
        headerMapping.push(colIndex);
      }
    }
    
    if (headers.length === 0) {
      alert('No columns mapped. Please map at least one column before exporting.');
      return;
    }
    
    const csvRows: string[][] = [headers];
    
    for (const [rowIndex, row] of this.rows.entries()) {
      if (this.deletedRows.has(rowIndex)) continue;
      
      const csvRow: string[] = [];
      for (const colIndex of headerMapping) {
        let cellValue = row[colIndex] || '';
        if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
          cellValue = `"${cellValue.replace(/"/g, '""')}"`;
        }
        csvRow.push(cellValue);
      }
      csvRows.push(csvRow);
    }
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `exported_data_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  countValidationErrors(): number {
    let errorCount = 0;
    this.shadow.querySelectorAll(`.${invalidCellClassName}`).forEach(() => {
      errorCount++;
    });
    return errorCount;
  }

  updateErrorDisplay() {
    const errorDisplay = this.shadow.getElementById(ids.errorDisplay);
    if (!errorDisplay) return;
    
    const errorCount = this.countValidationErrors();
    
    if (errorCount === 0) {
      errorDisplay.className = 'error-display success';
      errorDisplay.style.display = 'block';
      
      while (errorDisplay.firstChild) {
        errorDisplay.removeChild(errorDisplay.firstChild);
      }
      
      const countDiv = createElement(tag.div, {}, ['error-count']);
      countDiv.innerHTML = '✓ All validation checks passed!';
      errorDisplay.appendChild(countDiv);
      
      const messageDiv = createElement(tag.div, {}, ['error-message']);
      messageDiv.textContent = 'Your data is ready to submit.';
      errorDisplay.appendChild(messageDiv);
      
      this.enableButton(ids.submitFile);
    } else {
      errorDisplay.className = 'error-display';
      errorDisplay.style.display = 'block';
      
      while (errorDisplay.firstChild) {
        errorDisplay.removeChild(errorDisplay.firstChild);
      }
      
      const countDiv = createElement(tag.div, {}, ['error-count']);
      countDiv.innerHTML = `⚠ ${errorCount} validation error${errorCount === 1 ? '' : 's'} found`;
      errorDisplay.appendChild(countDiv);
      
      const messageDiv = createElement(tag.div, {}, ['error-message']);
      messageDiv.textContent = 'Please correct the highlighted cells (in red) before submitting. Click on any cell to edit it.';
      errorDisplay.appendChild(messageDiv);
      
      this.disableButton(ids.submitFile);
    }
  }

  async submitFile() {
    this.context.preSubmitFileContext = true;
    
    for (let colIndex = 0; colIndex < this.cols.length; colIndex++) {
      if (!this.values.has(String(colIndex))) continue;

      this.shadow.querySelectorAll(`tr td[col="${colIndex}"]`).forEach(td => {
        this.checkValidity(td, colIndex);
      });
    }
    
    const errorCount = this.countValidationErrors();
    
    if (errorCount > 0) {
      alert(
        `Cannot submit! There ${errorCount === 1 ? 'is' : 'are'} ${errorCount} validation error${errorCount === 1 ? '' : 's'}.\n\n` +
        'Please correct the highlighted errors in red before submitting.'
      );
      return;
    }
    
    // No errors - proceed with submission
    const data = this.generateResult();
    await this.submit(data);
  }

  generateResult() {
    const content = new UploadEntry();
    for (const [rowIndex, row] of this.rows.entries()) {
      if (this.deletedRows.has(rowIndex)) continue;
      const data: Map<string, Cell> = new Map<string, Cell>();
      for (const [colIndex, header] of this.cols.entries()) {
        if (header.value == null) continue;

        data.set(header.value, new Cell(row[colIndex], rowIndex, colIndex));
      }
      const plainObject = Object.fromEntries(data);
      content.lines.push(plainObject);
    }
    return content;
  }

  checkCell(cellValue: string, option: Option) {
    if (isEmpty(cellValue)) {
      if (option.mandatory) {
        return { valid: false, message: ['Mandatory field missing'] };
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
      return `Text length is not ${textPerComparer[condition.comparer]} ${condition.value}`;
    } else if (condition.property === ConditonProperty.value) {
      return `Value is not ${textPerComparer[condition.comparer]} ${condition.value}`;
    }
    return '';
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
    return evaluateConditions['regExp'](value, conditionValue);
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
      return [value in ['Yes', 'No'], "Possible values are 'Yes' or 'No'"];
    }

    return [true, ''];
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

customElements.define('app-matchy', Matchy);
