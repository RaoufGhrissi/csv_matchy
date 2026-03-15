import { MatchyManager } from '../MatchyManager';
import { Option } from '@csv-matchy/core';
import { FieldType } from '@csv-matchy/core';
import { Condition } from '@csv-matchy/core';
import { ConditionProperty } from '@csv-matchy/core';
import { Comparer } from '@csv-matchy/core';

describe('MatchyManager', () => {
  let rules: Array<{ field: string; option: Option }>;
  let manager: MatchyManager;

  beforeEach(() => {
    rules = [
      { 
        field: 'name', 
        option: new Option('Name', 'name', true, FieldType.string, []) 
      },
      { 
        field: 'age', 
        option: new Option('Age', 'age', true, FieldType.integer, [
          new Condition(ConditionProperty.value, 0, Comparer.gte),
          new Condition(ConditionProperty.value, 150, Comparer.lte)
        ]) 
      }
    ];
    manager = new MatchyManager(rules);
  });

  describe('loadData', () => {
    it('should load data correctly', () => {
      const data = [
        { name: 'John', age: '25' },
        { name: 'Jane', age: '30' }
      ];
      
      manager.loadData(data);
      
      expect(manager.getData()).toEqual(data);
    });
  });

  describe('validate', () => {
    it('should validate valid data', () => {
      manager.loadData([{ name: 'John', age: '25' }]);
      const results = manager.validate();

      expect(results.isValid).toBe(true);
      expect(results.invalidCells.length).toBe(0);
    });

    it('should detect invalid mandatory field', () => {
      manager.loadData([{ name: '', age: '25' }]);
      const results = manager.validate();

      expect(results.isValid).toBe(false);
      expect(results.invalidCells.length).toBeGreaterThan(0);
    });

    it('should detect invalid type', () => {
      manager.loadData([{ name: 'John', age: 'not-a-number' }]);
      const results = manager.validate();

      expect(results.isValid).toBe(false);
    });

    it('should detect invalid conditions', () => {
      manager.loadData([{ name: 'John', age: '200' }]);
      const results = manager.validate();

      expect(results.isValid).toBe(false);
    });

    it('should return results with row index', () => {
      manager.loadData([
        { name: 'John', age: '25' },
        { name: '', age: 'invalid' }
      ]);
      const results = manager.validate();

      expect(results.results.length).toBe(2);
      expect(results.results[0].rowIndex).toBe(0);
      expect(results.results[1].rowIndex).toBe(1);
    });
  });

  describe('events', () => {
    it('should emit data-loaded event', () => {
      const callback = jest.fn();
      manager.on('data-loaded', callback);
      
      manager.loadData([{ name: 'John', age: '25' }]);
      
      expect(callback).toHaveBeenCalledWith([{ name: 'John', age: '25' }]);
    });

    it('should emit validation-complete event', () => {
      const callback = jest.fn();
      manager.on('validation-complete', callback);
      
      manager.loadData([{ name: 'John', age: '25' }]);
      manager.validate();
      
      expect(callback).toHaveBeenCalled();
    });

    it('should allow removing event listeners', () => {
      const callback = jest.fn();
      manager.on('data-loaded', callback);
      manager.off('data-loaded', callback);
      
      manager.loadData([{ name: 'John', age: '25' }]);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('getResults', () => {
    it('should return null before validation', () => {
      manager.loadData([{ name: 'John', age: '25' }]);
      
      expect(manager.getResults()).toBeNull();
    });

    it('should return results after validation', () => {
      manager.loadData([{ name: 'John', age: '25' }]);
      manager.validate();
      
      expect(manager.getResults()).not.toBeNull();
      expect(manager.getResults()?.isValid).toBe(true);
    });
  });
});
