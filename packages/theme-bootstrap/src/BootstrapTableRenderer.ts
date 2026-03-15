import { TableRenderer as BaseTableRenderer, InvalidCell } from '@csv-matchy/vanilla';

export interface BootstrapTableRendererOptions {
  editable?: boolean;
  onCellChange?: (rowIndex: number, field: string, newValue: string) => void;
}

export class BootstrapTableRenderer {
  private renderer: BaseTableRenderer;
  private options: BootstrapTableRendererOptions;

  constructor(containerId: string, options: BootstrapTableRendererOptions = {}) {
    this.renderer = new BaseTableRenderer(containerId, 'table-danger', 'table-success');
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
    table.className = 'table table-striped table-hover table-bordered';

    const thead = document.createElement('thead');
    thead.className = 'table-dark';
    const headerRow = document.createElement('tr');
    headers.forEach((h: string) => {
      const th = document.createElement('th');
      th.scope = 'col';
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
        td.dataset.original = row[h] || '';

        const isInvalid = invalidCells.some(
          (cell: InvalidCell) => cell.row === rowIdx && cell.col === colIdx
        );

        if (isInvalid) {
          td.classList.add('table-danger');
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
            input.style.width = '100%';
            input.className = 'form-control form-control-sm p-0 border-0 bg-transparent';

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
