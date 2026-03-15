import { useCallback } from 'react';
import { RowValidator, RowValidationResult, Option } from '@csv-matchy/core';

export interface ValidationRule {
  field: string;
  option: Option;
}

type InvalidCell = { row: number; col: number; field: string; errors: Array<{ field: string; message: string }> };

export interface UseMatchyEditResult {
  commitEdit: (rowIndex: number, field: string, newValue: string) => RowValidationResult;
}

export function useMatchyEdit(
  rules: ValidationRule[],
  data: Record<string, string>[],
  setData: React.Dispatch<React.SetStateAction<Record<string, string>[]>>,
  setInvalidCells: React.Dispatch<React.SetStateAction<InvalidCell[]>>
): UseMatchyEditResult {
  const commitEdit = useCallback(
    (rowIndex: number, field: string, newValue: string): RowValidationResult => {
      const newRow = { ...data[rowIndex], [field]: newValue };

      setData(prev => {
        const next = [...prev];
        next[rowIndex] = newRow;
        return next;
      });

      const rowValidator = new RowValidator(rules);
      const result = rowValidator.validate(newRow, rowIndex);

      setInvalidCells(prev => [
        ...prev.filter(cell => cell.row !== rowIndex),
        ...result.invalidCells,
      ]);

      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, data, setData, setInvalidCells]
  );

  return { commitEdit };
}
