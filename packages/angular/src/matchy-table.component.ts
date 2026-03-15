import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewChecked,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface InvalidCell {
  row: number;
  col: number;
  field: string;
  errors: Array<{ field: string; message: string }>;
}

export interface CellChangeEvent {
  rowIndex: number;
  field: string;
  newValue: string;
}

@Component({
  selector: 'csv-matchy-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <table [class]="tableClass">
      <thead>
        <tr>
          <th *ngFor="let header of headers" [class]="headerClass">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let row of data; let i = index" [class]="rowClass">
          <td
            *ngFor="let header of headers; let j = index"
            [ngClass]="getCellClass(i, j)"
            [title]="isEditing(i, j) ? '' : getErrors(i, j)"
            [style.cursor]="editable ? 'pointer' : null"
            (click)="startEdit(i, j)"
          >
            <ng-container *ngIf="isEditing(i, j); else displayCell">
              <input
                #cellInput
                [defaultValue]="row[header]"
                (keydown.enter)="commitEdit(i, j, header, cellInput.value)"
                (keydown.escape)="cancelEdit()"
                (blur)="commitEdit(i, j, header, cellInput.value)"
                style="width:100%;border:none;background:transparent;font:inherit;color:inherit;outline:2px solid #4a90d9;border-radius:2px;padding:0;box-sizing:border-box;"
              />
            </ng-container>
            <ng-template #displayCell>{{ row[header] }}</ng-template>
          </td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [`
    :host {
      display: block;
    }

    .matchy-table {
      --matchy-border-color: #ddd;
      --matchy-header-bg: #f8f9fa;
      --matchy-header-text: #333;
      --matchy-row-bg: #fff;
      --matchy-row-alt-bg: #f8f9fa;
      --matchy-valid-bg: #d4edda;
      --matchy-valid-text: #155724;
      --matchy-invalid-bg: #f8d7da;
      --matchy-invalid-text: #721c24;
      --matchy-cell-padding: 12px;

      width: 100%;
      border-collapse: collapse;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      border: 1px solid var(--matchy-border-color);
    }

    .matchy-table th {
      background-color: var(--matchy-header-bg);
      color: var(--matchy-header-text);
      padding: var(--matchy-cell-padding);
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid var(--matchy-border-color);
    }

    .matchy-table td {
      padding: var(--matchy-cell-padding);
      border-bottom: 1px solid var(--matchy-border-color);
    }

    .matchy-table tr:nth-child(even) {
      background-color: var(--matchy-row-alt-bg);
    }

    .matchy-table tr:hover {
      background-color: #e9ecef;
    }

    .matchy-valid {
      background-color: var(--matchy-valid-bg) !important;
      color: var(--matchy-valid-text) !important;
    }

    .matchy-invalid {
      background-color: var(--matchy-invalid-bg) !important;
      color: var(--matchy-invalid-text) !important;
    }
  `]
})
export class MatchyTableComponent implements AfterViewChecked {
  @Input() data: Record<string, string>[] = [];
  @Input() headers: string[] = [];
  @Input() invalidCells: InvalidCell[] = [];
  @Input() className = 'matchy-table';
  @Input() validCellClass = 'matchy-valid';
  @Input() invalidCellClass = 'matchy-invalid';
  @Input() headerClass = '';
  @Input() rowClass = '';
  @Input() editable = false;
  @Output() cellChange = new EventEmitter<CellChangeEvent>();

  @ViewChildren('cellInput') cellInputs!: QueryList<ElementRef<HTMLInputElement>>;

  editingCell: { row: number; col: number } | null = null;
  private _shouldFocus = false;

  get tableClass(): string {
    return this.className || 'matchy-table';
  }

  ngAfterViewChecked(): void {
    if (this._shouldFocus && this.cellInputs?.first) {
      this.cellInputs.first.nativeElement.focus();
      this._shouldFocus = false;
    }
  }

  startEdit(row: number, col: number): void {
    if (!this.editable) return;
    if (this.isEditing(row, col)) return;
    this.editingCell = { row, col };
    this._shouldFocus = true;
  }

  commitEdit(row: number, col: number, field: string, value: string): void {
    if (!this.isEditing(row, col)) return;
    this.editingCell = null;
    this.cellChange.emit({ rowIndex: row, field, newValue: value });
  }

  cancelEdit(): void {
    this.editingCell = null;
  }

  isEditing(row: number, col: number): boolean {
    return this.editingCell?.row === row && this.editingCell?.col === col;
  }

  isInvalid(row: number, col: number): boolean {
    return this.invalidCells.some(cell => cell.row === row && cell.col === col);
  }

  getCellClass(row: number, col: number): string {
    return this.isInvalid(row, col) ? this.invalidCellClass : this.validCellClass;
  }

  getErrors(row: number, col: number): string {
    const cell = this.invalidCells.find(c => c.row === row && c.col === col);
    return cell?.errors.map(e => e.message).join('\n') || '';
  }
}
