import { Option } from "../models/classes/option";
import { FieldValidator, FieldValidationResult, ValidationError } from "./FieldValidator";

export interface RowValidationResult {
  isValid: boolean;
  rowIndex: number;
  fieldResults: Map<string, FieldValidationResult>;
  invalidCells: Array<{ row: number; col: number; field: string; errors: ValidationError[] }>;
}

export class RowValidator {
  private fieldValidator: FieldValidator;
  private rules: Map<string, Option>;

  constructor(rules: Array<{ field: string; option: Option }>) {
    this.fieldValidator = new FieldValidator();
    this.rules = new Map(rules.map(r => [r.field, r.option]));
  }

  validate(row: Record<string, string>, rowIndex: number = 0): RowValidationResult {
    const fieldResults = new Map<string, FieldValidationResult>();
    const invalidCells: Array<{ row: number; col: number; field: string; errors: ValidationError[] }> = [];
    let isValid = true;

    let colIndex = 0;
    for (const [field, value] of Object.entries(row)) {
      const option = this.rules.get(field);
      if (!option) {
        colIndex++;
        continue;
      }

      const result = this.fieldValidator.validate(value, option, field);
      fieldResults.set(field, result);

      if (!result.isValid) {
        isValid = false;
        invalidCells.push({
          row: rowIndex,
          col: colIndex,
          field,
          errors: result.errors
        });
      }
      colIndex++;
    }

    for (const [field, option] of this.rules.entries()) {
      if (!(field in row) && option.mandatory) {
        isValid = false;
        invalidCells.push({
          row: rowIndex,
          col: -1,
          field,
          errors: [{ field, message: 'Mandatory field missing' }]
        });
      }
    }

    return {
      isValid,
      rowIndex,
      fieldResults,
      invalidCells
    };
  }

  validateAll(rows: Record<string, string>[]): RowValidationResult[] {
    return rows.map((row, index) => this.validate(row, index));
  }
}
