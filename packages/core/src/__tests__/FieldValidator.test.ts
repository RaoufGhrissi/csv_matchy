import { FieldValidator } from '../validators/FieldValidator';
import { Option } from '../models/classes/option';
import { Condition } from '../models/classes/condition';
import { FieldType } from '../models/enums/field_type';
import { Comparer } from '../models/enums/comparer';
import { ConditionProperty } from '../models/enums/condition_property';

describe('FieldValidator', () => {
  let validator: FieldValidator;

  beforeEach(() => {
    validator = new FieldValidator();
  });

  describe('validateMandatory', () => {
    it('should return error for empty string', () => {
      const result = validator.validateMandatory('', 'name');
      expect(result).not.toBeNull();
      expect(result?.message).toBe('Mandatory field missing');
    });

    it('should return error for null value', () => {
      const result = validator.validateMandatory(null as any, 'name');
      expect(result).not.toBeNull();
      expect(result?.message).toBe('Mandatory field missing');
    });

    it('should return error for undefined value', () => {
      const result = validator.validateMandatory(undefined as any, 'name');
      expect(result).not.toBeNull();
    });

    it('should return null for valid value', () => {
      const result = validator.validateMandatory('John', 'name');
      expect(result).toBeNull();
    });
  });

  describe('validateType', () => {
    it('should validate integer type correctly', () => {
      const result = validator.validateType('123', FieldType.integer);
      expect(result.valid).toBe(true);

      const invalidResult = validator.validateType('abc', FieldType.integer);
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate float type correctly', () => {
      const result = validator.validateType('123.45', FieldType.float);
      expect(result.valid).toBe(true);

      const invalidResult = validator.validateType('abc', FieldType.float);
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate bool type correctly', () => {
      expect(validator.validateType('Yes', FieldType.bool).valid).toBe(true);
      expect(validator.validateType('No', FieldType.bool).valid).toBe(true);
      expect(validator.validateType('Maybe', FieldType.bool).valid).toBe(false);
    });

    it('should always return valid for string type', () => {
      const result = validator.validateType('any value', FieldType.string);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateConditions', () => {
    it('should validate length conditions', () => {
      const conditions = [
        new Condition(ConditionProperty.length, 5, Comparer.gte),
        new Condition(ConditionProperty.length, 10, Comparer.lt)
      ];

      const errors = validator.validateConditions('Hello', conditions, 'name');
      expect(errors.length).toBe(0);

      const shortErrors = validator.validateConditions('Hi', conditions, 'name');
      expect(shortErrors.length).toBeGreaterThan(0);
    });

    it('should validate value conditions', () => {
      const conditions = [
        new Condition(ConditionProperty.value, 18, Comparer.gte)
      ];

      const validErrors = validator.validateConditions('25', conditions, 'age');
      expect(validErrors.length).toBe(0);

      const invalidErrors = validator.validateConditions('15', conditions, 'age');
      expect(invalidErrors.length).toBeGreaterThan(0);
    });

    it('should validate regex conditions', () => {
      const conditions = [
        new Condition(ConditionProperty.regex, '^\\d{3}-\\d{4}$')
      ];

      const validErrors = validator.validateConditions('123-4567', conditions, 'phone');
      expect(validErrors.length).toBe(0);

      const invalidErrors = validator.validateConditions('abc-defg', conditions, 'phone');
      expect(invalidErrors.length).toBeGreaterThan(0);
    });

    it('should validate "in" comparer', () => {
      const conditions = [
        new Condition(ConditionProperty.value, ['red', 'blue', 'green'], Comparer.in)
      ];

      const validErrors = validator.validateConditions('red', conditions, 'color');
      expect(validErrors.length).toBe(0);

      const invalidErrors = validator.validateConditions('yellow', conditions, 'color');
      expect(invalidErrors.length).toBeGreaterThan(0);
    });

    it('should use custom fail message when provided', () => {
      const conditions = [
        new Condition(ConditionProperty.length, 5, Comparer.gte, 'Custom error message')
      ];

      const errors = validator.validateConditions('Hi', conditions, 'name');
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Custom error message');
    });
  });

  describe('validate (full validation)', () => {
    it('should validate mandatory field', () => {
      const option = new Option('Name', 'name', true, FieldType.string, []);
      const result = validator.validate('', option, 'name');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should skip mandatory check for empty optional field', () => {
      const option = new Option('Name', 'name', false, FieldType.string, []);
      const result = validator.validate('', option, 'name');
      
      expect(result.isValid).toBe(true);
    });

    it('should validate type first, then conditions', () => {
      const option = new Option('Age', 'age', true, FieldType.integer, [
        new Condition(ConditionProperty.value, 0, Comparer.gte),
        new Condition(ConditionProperty.value, 150, Comparer.lte)
      ]);

      const result = validator.validate('25', option, 'age');
      expect(result.isValid).toBe(true);

      const invalidType = validator.validate('not-a-number', option, 'age');
      expect(invalidType.isValid).toBe(false);
    });
  });

  describe('isValidInteger', () => {
    it('should validate valid integers', () => {
      expect(validator.isValidInteger('123')).toBe(true);
      expect(validator.isValidInteger('0')).toBe(true);
      expect(validator.isValidInteger('-456')).toBe(true);
    });

    it('should reject invalid integers', () => {
      expect(validator.isValidInteger('123.45')).toBe(false);
      expect(validator.isValidInteger('abc')).toBe(false);
      expect(validator.isValidInteger(' 123')).toBe(false);
      expect(validator.isValidInteger('123 ')).toBe(false);
    });
  });

  describe('isValidFloat', () => {
    it('should validate valid floats', () => {
      expect(validator.isValidFloat('123.45')).toBe(true);
      expect(validator.isValidFloat('0.5')).toBe(true);
      expect(validator.isValidFloat('-123.45')).toBe(true);
    });

    it('should reject invalid floats', () => {
      expect(validator.isValidFloat('abc')).toBe(false);
      expect(validator.isValidFloat('123.45.67')).toBe(false);
    });
  });
});
