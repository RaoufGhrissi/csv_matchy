import { Injectable } from '@angular/core';
import { RowValidator, RowValidationResult, Option } from '@csv-matchy/core';

export interface ValidationRule {
  field: string;
  option: Option;
}

export interface InvalidCell {
  row: number;
  col: number;
  field: string;
  errors: Array<{ field: string; message: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class MatchyService {
  validate(data: Record<string, string>[], rules: ValidationRule[]): RowValidationResult[] {
    const rowValidator = new RowValidator(rules);
    return rowValidator.validateAll(data);
  }

  validateRow(
    row: Record<string, string>,
    rowIndex: number,
    rules: ValidationRule[]
  ): RowValidationResult {
    const rowValidator = new RowValidator(rules);
    return rowValidator.validate(row, rowIndex);
  }

  patchInvalidCells(
    current: InvalidCell[],
    rowIndex: number,
    rowResult: RowValidationResult
  ): InvalidCell[] {
    return [
      ...current.filter(c => c.row !== rowIndex),
      ...rowResult.invalidCells,
    ];
  }

  exportCSV(data: Record<string, string>[], headers: string[]): string {
    if (data.length === 0) return '';

    const escape = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const lines = [
      headers.map(escape).join(','),
      ...data.map(row => headers.map(h => escape(row[h] ?? '')).join(',')),
    ];

    return lines.join('\n');
  }

  downloadCSV(data: Record<string, string>[], headers: string[], filename = 'export.csv'): void {
    const csv = this.exportCSV(data, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
