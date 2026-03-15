export interface InvalidCell {
  row: number;
  col: number;
  field?: string;
  errors?: Array<{ field: string; message: string }>;
}

export class TableRenderer {
  constructor(
    private containerId: string,
    private invalidCellClass: string = 'invalid',
    private validCellClass: string = 'valid'
  ) {}

  render(
    data: Record<string, string>[],
    headers: string[],
    invalidCells: InvalidCell[] = []
  ): void {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const table = document.createElement('table');
    table.className = 'matchy-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach((h: string) => {
      const th = document.createElement('th');
      th.textContent = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach((row: Record<string, string>, rowIdx: number) => {
      const tr = document.createElement('tr');
      headers.forEach((h: string, colIdx: number) => {
        const td = document.createElement('td');
        td.textContent = row[h] || '';

        const isInvalid = invalidCells.some(
          (cell: InvalidCell) => cell.row === rowIdx && cell.col === colIdx
        );
        td.className = isInvalid ? this.invalidCellClass : this.validCellClass;

        const cellErrors = invalidCells.find(
          (cell: InvalidCell) => cell.row === rowIdx && cell.col === colIdx
        );
        if (cellErrors?.errors) {
          td.title = cellErrors.errors.map((e: { message: string }) => e.message).join('\n');
        }

        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
  }

  clear(): void {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }
  }

  getContainerId(): string {
    return this.containerId;
  }
}
