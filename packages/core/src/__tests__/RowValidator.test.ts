import { RowValidator } from '../validators/RowValidator';
import { Option } from '../models/classes/option';
import { Condition } from '../models/classes/condition';
import { FieldType } from '../models/enums/field_type';
import { Comparer } from '../models/enums/comparer';
import { ConditionProperty } from '../models/enums/condition_property';

describe('RowValidator', () => {
  let rules: Array<{ field: string; option: Option }>;

  beforeEach(() => {
    rules = [
      { field: 'name', option: new Option('Name', 'name', true, FieldType.string, []) },
      { field: 'age', option: new Option('Age', 'age', true, FieldType.integer, [
        new Condition(ConditionProperty.value, 0, Comparer.gte),
        new Condition(ConditionProperty.value, 150, Comparer.lte)
      ]) },
      { field: 'email', option: new Option('Email', 'email', false, FieldType.string, []) }
    ];
  });

  describe('validate', () => {
    it('should validate a valid row', () => {
      const validator = new RowValidator(rules);
      const row = { name: 'John', age: '25', email: 'john@example.com' };
      const result = validator.validate(row, 0);

      expect(result.isValid).toBe(true);
      expect(result.invalidCells.length).toBe(0);
    });

    it('should detect invalid mandatory field', () => {
      const validator = new RowValidator(rules);
      const row = { name: '', age: '25', email: 'john@example.com' };
      const result = validator.validate(row, 0);

      expect(result.isValid).toBe(false);
      expect(result.invalidCells.length).toBeGreaterThan(0);
    });

    it('should detect invalid type', () => {
      const validator = new RowValidator(rules);
      const row = { name: 'John', age: 'not-a-number', email: 'john@example.com' };
      const result = validator.validate(row, 0);

      expect(result.isValid).toBe(false);
      const ageErrors = result.invalidCells.filter(c => c.field === 'age');
      expect(ageErrors.length).toBeGreaterThan(0);
    });

    it('should detect invalid condition', () => {
      const validator = new RowValidator(rules);
      const row = { name: 'John', age: '200', email: 'john@example.com' };
      const result = validator.validate(row, 0);

      expect(result.isValid).toBe(false);
      const ageErrors = result.invalidCells.filter(c => c.field === 'age');
      expect(ageErrors.length).toBeGreaterThan(0);
    });

    it('should handle missing fields', () => {
      const validator = new RowValidator(rules);
      const row = { name: 'John' };
      const result = validator.validate(row, 0);

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAll', () => {
    it('should validate multiple rows', () => {
      const validator = new RowValidator(rules);
      const data = [
        { name: 'John', age: '25', email: 'john@example.com' },
        { name: 'Jane', age: '30', email: 'jane@example.com' },
        { name: '', age: '35', email: 'invalid' }
      ];

      const results = validator.validateAll(data);

      expect(results.length).toBe(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
      expect(results[2].isValid).toBe(false);
    });

    it('should track row indices correctly', () => {
      const validator = new RowValidator(rules);
      const data = [
        { name: 'John', age: '25', email: 'john@example.com' },
        { name: '', age: 'invalid', email: 'test' }
      ];

      const results = validator.validateAll(data);

      expect(results[0].rowIndex).toBe(0);
      expect(results[1].rowIndex).toBe(1);
    });
  });

  describe('invalidCells', () => {
    it('should include row and column indices', () => {
      const validator = new RowValidator(rules);
      const row = { name: '', age: 'invalid', email: 'john@example.com' };
      const result = validator.validate(row, 5);

      expect(result.invalidCells.length).toBeGreaterThan(0);
      result.invalidCells.forEach(cell => {
        expect(cell.row).toBe(5);
        expect(cell.col).toBeDefined();
        expect(cell.errors).toBeDefined();
      });
    });
  });
});
