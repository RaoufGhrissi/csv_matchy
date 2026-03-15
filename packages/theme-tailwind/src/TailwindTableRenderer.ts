import { TableRenderer as BaseTableRenderer, InvalidCell } from '@csv-matchy/vanilla';

export interface TailwindTableRendererOptions {
  editable?: boolean;
  onCellChange?: (rowIndex: number, field: string, newValue: string) => void;
}

export class TailwindTableRenderer {
  private renderer: BaseTableRenderer;
  private options: TailwindTableRendererOptions;

  constructor(containerId: string, options: TailwindTableRendererOptions = {}) {
    this.renderer = new BaseTableRenderer(containerId, 'bg-red-100', 'bg-green-100');
    this.options = options;
  }

  render(
    data: Record<string, string>[],
    headers: string[],
    invalidCells: InvalidCell[] = []
  ): void {
    const container = document.getElementById(this.renderer.getContainerId());
    if (!container) return;

    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';

    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    const headerRow = document.createElement('tr');
    headers.forEach((h: string) => {
      const th = document.createElement('th');
      th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
      th.textContent = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    data.forEach((row: Record<string, string>, rowIdx: number) => {
      const tr = document.createElement('tr');
      tr.className = rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50';

      headers.forEach((h: string, colIdx: number) => {
        const td = document.createElement('td');
        td.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
        td.textContent = row[h] || '';
        td.dataset.original = row[h] || '';

        const isInvalid = invalidCells.some(
          (cell: InvalidCell) => cell.row === rowIdx && cell.col === colIdx
        );

        if (isInvalid) {
          td.classList.add('bg-red-100', 'text-red-800');
        }

        const cellErrors = invalidCells.find(
          (cell: InvalidCell) => cell.row === rowIdx && cell.col === colIdx
        );
        if (cellErrors?.errors) {
          td.title = cellErrors.errors.map((e: { message: string }) => e.message).join('\n');
        }

        if (this.options.editable) {
          td.style.cursor = 'pointer';
          td.addEventListener('click', () => {
            if (td.querySelector('input')) return;

            const original = td.textContent || '';
            const input = document.createElement('input');
            input.value = original;
            input.className = 'w-full bg-transparent border-0 outline-none ring-2 ring-blue-400 rounded p-0 text-sm';

            td.textContent = '';
            td.appendChild(input);
            input.focus();

            const save = () => {
              const newVal = input.value;
              td.textContent = newVal;
              td.dataset.original = newVal;
              this.options.onCellChange?.(rowIdx, h, newVal);
            };

            const cancel = () => {
              td.textContent = td.dataset.original || '';
            };

            input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') { e.preventDefault(); save(); }
              if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            });
            input.addEventListener('blur', save);
          });
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
    this.renderer.clear();
  }
}
