import { RowValidator, RowValidationResult, Option } from '@csv-matchy/core';

export interface ValidationRule {
  field: string;
  option: Option;
}

export interface ValidationResults {
  results: RowValidationResult[];
  invalidCells: Array<{ row: number; col: number; field: string; errors: Array<{ field: string; message: string }> }>;
  isValid: boolean;
}

type EventCallback = (data: unknown) => void;

export class MatchyManager {
  private data: Record<string, string>[] = [];
  private results: ValidationResults | null = null;
  private listeners: Map<string, EventCallback[]> = new Map();
  private validationRules: ValidationRule[];

  constructor(validationRules: ValidationRule[]) {
    this.validationRules = validationRules;
  }

  loadData(data: Record<string, string>[]): void {
    this.data = data;
    this.emit('data-loaded', this.data);
  }

  validate(): ValidationResults {
    const rowValidator = new RowValidator(this.validationRules);
    const results = rowValidator.validateAll(this.data);

    const invalidCells: Array<{ row: number; col: number; field: string; errors: Array<{ field: string; message: string }> }> = [];
    results.forEach((result: RowValidationResult) => {
      if (!result.isValid) {
        result.invalidCells.forEach((cell: { row: number; col: number; field: string; errors: Array<{ field: string; message: string }> }) => {
          invalidCells.push(cell);
        });
      }
    });

    this.results = {
      results,
      invalidCells,
      isValid: invalidCells.length === 0
    };

    this.emit('validation-complete', this.results);
    return this.results;
  }

  editCell(rowIndex: number, field: string, newValue: string): void {
    if (rowIndex < 0 || rowIndex >= this.data.length) return;
    this.data[rowIndex] = { ...this.data[rowIndex], [field]: newValue };
    this.emit('cell-updated', { rowIndex, field, newValue });
  }

  revalidateRow(rowIndex: number): void {
    if (rowIndex < 0 || rowIndex >= this.data.length) return;

    const rowValidator = new RowValidator(this.validationRules);
    const rowResult = rowValidator.validate(this.data[rowIndex], rowIndex);

    if (this.results) {
      this.results.results[rowIndex] = rowResult;
      const otherCells = this.results.invalidCells.filter(c => c.row !== rowIndex);
      this.results.invalidCells = [...otherCells, ...rowResult.invalidCells];
      this.results.isValid = this.results.invalidCells.length === 0;
    } else {
      this.results = {
        results: [rowResult],
        invalidCells: rowResult.invalidCells,
        isValid: rowResult.invalidCells.length === 0,
      };
    }

    this.emit('validation-complete', this.results);
  }

  updateAndRevalidate(rowIndex: number, field: string, newValue: string): void {
    this.editCell(rowIndex, field, newValue);
    this.revalidateRow(rowIndex);
  }

  exportCSV(): string {
    if (this.data.length === 0) return '';
    const headers = Object.keys(this.data[0]);

    const escape = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const lines = [
      headers.map(escape).join(','),
      ...this.data.map(row => headers.map(h => escape(row[h] ?? '')).join(',')),
    ];

    return lines.join('\n');
  }

  getResults(): ValidationResults | null {
    return this.results;
  }

  getData(): Record<string, string>[] {
    return this.data;
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(
        event,
        callbacks.filter(cb => cb !== callback)
      );
    }
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
}
