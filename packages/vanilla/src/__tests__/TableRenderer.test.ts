import { TableRenderer } from '../TableRenderer';

describe('TableRenderer', () => {
  let renderer: TableRenderer;
  const containerId = 'test-container';

  beforeEach(() => {
    document.body.innerHTML = `<div id="${containerId}"></div>`;
    renderer = new TableRenderer(containerId);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('render', () => {
    it('should render a table', () => {
      const data = [
        { name: 'John', age: '25' },
        { name: 'Jane', age: '30' }
      ];
      const headers = ['name', 'age'];

      renderer.render(data, headers);

      const table = document.querySelector('table');
      expect(table).not.toBeNull();
      expect(table?.querySelectorAll('th').length).toBe(2);
      expect(table?.querySelectorAll('tbody tr').length).toBe(2);
    });

    it('should add invalid class to invalid cells', () => {
      const data = [{ name: 'John', age: '25' }];
      const headers = ['name', 'age'];
      const invalidCells = [{ row: 0, col: 0 }];

      renderer.render(data, headers, invalidCells);

      const cells = document.querySelectorAll('td');
      expect(cells[0].classList.contains('invalid')).toBe(true);
      expect(cells[1].classList.contains('valid')).toBe(true);
    });

    it('should add valid class to valid cells', () => {
      const data = [{ name: 'John', age: '25' }];
      const headers = ['name', 'age'];

      renderer.render(data, headers);

      const cells = document.querySelectorAll('td');
      expect(cells[0].classList.contains('valid')).toBe(true);
      expect(cells[1].classList.contains('valid')).toBe(true);
    });

    it('should display error tooltip for invalid cells', () => {
      const data = [{ name: '', age: '25' }];
      const headers = ['name', 'age'];
      const invalidCells = [{
        row: 0,
        col: 0,
        field: 'name',
        errors: [{ field: 'name', message: 'Mandatory field missing' }]
      }];

      renderer.render(data, headers, invalidCells);

      const cell = document.querySelector('td');
      expect(cell?.getAttribute('title')).toBe('Mandatory field missing');
    });
  });

  describe('clear', () => {
    it('should clear the container', () => {
      const data = [{ name: 'John', age: '25' }];
      const headers = ['name', 'age'];

      renderer.render(data, headers);
      expect(document.querySelector('table')).not.toBeNull();

      renderer.clear();
      expect(document.querySelector('table')).toBeNull();
    });
  });
});
