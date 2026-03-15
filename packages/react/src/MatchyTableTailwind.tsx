import React, { useState } from 'react';

export interface MatchyTableTailwindProps {
  data: Record<string, string>[];
  headers: string[];
  invalidCells?: Array<{ row: number; col: number; field: string; errors: Array<{ field: string; message: string }> }>;
  className?: string;
  /** Enable inline cell editing */
  editable?: boolean;
  /** Called after a cell value is committed */
  onCellChange?: (rowIndex: number, field: string, newValue: string) => void;
}

export function MatchyTableTailwind({
  data,
  headers,
  invalidCells = [],
  className = '',
  editable = false,
  onCellChange,
}: MatchyTableTailwindProps) {
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
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {headers.map((h, colIdx) => {
                const errors = getErrors(rowIdx, colIdx);
                const hasError = isInvalid(rowIdx, colIdx);
                const isEditing = editable && editingCell?.row === rowIdx && editingCell?.col === colIdx;
                return (
                  <td
                    key={colIdx}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      hasError ? 'bg-red-100 text-red-800' : 'text-gray-900'
                    }${editable ? ' cursor-pointer' : ''}`}
                    title={isEditing ? undefined : errors.join('\n')}
                    onClick={() => {
                      if (editable && !isEditing) setEditingCell({ row: rowIdx, col: colIdx });
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        defaultValue={row[h]}
                        className="w-full bg-transparent border-0 outline outline-2 outline-blue-400 rounded p-0 text-sm font-inherit"
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
