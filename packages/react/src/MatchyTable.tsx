import React, { useState } from 'react';

export interface MatchyTableProps {
  data: Record<string, string>[];
  headers: string[];
  invalidCells?: Array<{ row: number; col: number; field: string; errors: Array<{ field: string; message: string }> }>;
  className?: string;
  /** Custom class name for valid cells */
  validCellClass?: string;
  /** Custom class name for invalid cells */
  invalidCellClass?: string;
  /** Custom class name for table header */
  headerClass?: string;
  /** Custom class name for table rows */
  rowClass?: string;
  /** Custom class name for table body */
  bodyClass?: string;
  /** Enable inline cell editing */
  editable?: boolean;
  /** Called after a cell value is committed */
  onCellChange?: (rowIndex: number, field: string, newValue: string) => void;
}

const DEFAULT_CSS = `
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

  .matchy-table .matchy-valid {
    background-color: var(--matchy-valid-bg);
    color: var(--matchy-valid-text);
  }

  .matchy-table .matchy-invalid {
    background-color: var(--matchy-invalid-bg);
    color: var(--matchy-invalid-text);
  }

  .matchy-table td[data-editable] {
    cursor: pointer;
  }

  .matchy-table td[data-editable] input {
    width: 100%;
    border: none;
    background: transparent;
    font: inherit;
    color: inherit;
    outline: 2px solid #4a90d9;
    border-radius: 2px;
    padding: 0;
    box-sizing: border-box;
  }
`;

export function MatchyTable({
  data,
  headers,
  invalidCells = [],
  className = '',
  validCellClass = 'matchy-valid',
  invalidCellClass = 'matchy-invalid',
  headerClass = '',
  rowClass = '',
  bodyClass = '',
  editable = false,
  onCellChange,
}: MatchyTableProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

  const isInvalid = (rowIndex: number, colIndex: number) =>
    invalidCells.some(cell => cell.row === rowIndex && cell.col === colIndex);

  const getErrors = (rowIndex: number, colIndex: number): string[] => {
    const cell = invalidCells.find(cell => cell.row === rowIndex && cell.col === colIndex);
    return cell?.errors.map(e => e.message) || [];
  };

  const commit = (rowIdx: number, field: string, value: string) => {
    setEditingCell(null);
    onCellChange?.(rowIdx, field, value);
  };

  return (
    <>
      <style>{DEFAULT_CSS}</style>
      <table className={`matchy-table ${className}`}>
        <thead className={headerClass}>
          <tr className={rowClass}>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyClass}>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className={rowClass}>
              {headers.map((h, colIdx) => {
                const errors = getErrors(rowIdx, colIdx);
                const hasError = isInvalid(rowIdx, colIdx);
                const isEditing = editable && editingCell?.row === rowIdx && editingCell?.col === colIdx;
                return (
                  <td
                    key={colIdx}
                    className={hasError ? invalidCellClass : validCellClass}
                    title={isEditing ? undefined : errors.join('\n')}
                    data-editable={editable ? '' : undefined}
                    onClick={() => {
                      if (editable && !isEditing) setEditingCell({ row: rowIdx, col: colIdx });
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        defaultValue={row[h]}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commit(rowIdx, h, e.currentTarget.value);
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                        onBlur={(e) => commit(rowIdx, h, e.currentTarget.value)}
                      />
                    ) : (
                      row[h]
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
