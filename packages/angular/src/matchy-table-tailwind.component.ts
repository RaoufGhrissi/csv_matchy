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
import { InvalidCell, CellChangeEvent } from './matchy-table.component';

@Component({
  selector: 'csv-matchy-table-tailwind',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table [class]="tableClass">
        <thead class="bg-gray-50">
          <tr>
            <th
              *ngFor="let header of headers"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr *ngFor="let row of data; let i = index" [class]="i % 2 === 0 ? 'bg-white' : 'bg-gray-50'">
            <td
              *ngFor="let header of headers; let j = index"
              [class]="getCellClass(i, j)"
              [title]="isEditing(i, j) ? '' : getErrors(i, j)"
              [style.cursor]="editable ? 'pointer' : null"
              (click)="startEdit(i, j)"
            >
              <ng-container *ngIf="isEditing(i, j); else displayCell">
                <input
                  #cellInput
                  [defaultValue]="row[header]"
                  class="w-full bg-transparent border-0 outline-none ring-2 ring-blue-400 rounded p-0 text-sm"
                  (keydown.enter)="commitEdit(i, j, header, cellInput.value)"
                  (keydown.escape)="cancelEdit()"
                  (blur)="commitEdit(i, j, header, cellInput.value)"
                />
              </ng-container>
              <ng-template #displayCell>{{ row[header] }}</ng-template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class MatchyTableTailwindComponent implements AfterViewChecked {
  @Input() data: Record<string, string>[] = [];
  @Input() headers: string[] = [];
  @Input() invalidCells: InvalidCell[] = [];
  @Input() tableClass = 'min-w-full divide-y divide-gray-200';
  @Input() editable = false;
  @Output() cellChange = new EventEmitter<CellChangeEvent>();

  @ViewChildren('cellInput') cellInputs!: QueryList<ElementRef<HTMLInputElement>>;

  editingCell: { row: number; col: number } | null = null;
  private _shouldFocus = false;

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
    const base = 'px-6 py-4 whitespace-nowrap text-sm';
    return this.isInvalid(row, col) ? `${base} bg-red-100 text-red-800` : `${base} text-gray-900`;
  }

  getErrors(row: number, col: number): string {
    const cell = this.invalidCells.find(c => c.row === row && c.col === col);
    return cell?.errors.map(e => e.message).join('\n') || '';
  }
}
