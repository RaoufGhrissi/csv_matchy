import React, { useState } from 'react';

export interface MatchyTableBootstrapProps {
  data: Record<string, string>[];
  headers: string[];
  invalidCells?: Array<{ row: number; col: number; field: string; errors: Array<{ field: string; message: string }> }>;
  className?: string;
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  condensed?: boolean;
  /** Enable inline cell editing */
  editable?: boolean;
  /** Called after a cell value is committed */
  onCellChange?: (rowIndex: number, field: string, newValue: string) => void;
}

export function MatchyTableBootstrap({
  data,
  headers,
  invalidCells = [],
  className = '',
  striped = true,
  hover = true,
  bordered = false,
  condensed = false,
  editable = false,
  onCellChange,
}: MatchyTableBootstrapProps) {
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

  const tableClasses = [
    'table',
    striped && 'table-striped',
    hover && 'table-hover',
    bordered && 'table-bordered',
    condensed && 'table-condensed',
  ].filter(Boolean).join(' ');

  return (
    <div className="table-responsive">
      <table className={`${tableClasses} ${className}`}>
        <thead className="table-dark">
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {headers.map((h, colIdx) => {
                const errors = getErrors(rowIdx, colIdx);
                const hasError = isInvalid(rowIdx, colIdx);
                const isEditing = editable && editingCell?.row === rowIdx && editingCell?.col === colIdx;
                return (
                  <td
                    key={colIdx}
                    className={hasError ? 'table-danger' : ''}
                    title={isEditing ? undefined : errors.join('\n')}
                    style={editable ? { cursor: 'pointer' } : undefined}
                    onClick={() => {
                      if (editable && !isEditing) setEditingCell({ row: rowIdx, col: colIdx });
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        defaultValue={row[h]}
                        className="form-control form-control-sm p-0 border-0 bg-transparent"
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
    </div>
  );
}
