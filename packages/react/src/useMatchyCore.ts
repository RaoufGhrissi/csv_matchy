import { useState, useCallback } from 'react';
import { RowValidator, RowValidationResult, Option } from '@csv-matchy/core';

export interface ValidationRule {
  field: string;
  option: Option;
}

export interface UseMatchyCoreResult {
  validate: (data: Record<string, string>[]) => RowValidationResult[];
  results: RowValidationResult[] | null;
  errors: string[];
}

export function useMatchyCore(validationRules: ValidationRule[]): UseMatchyCoreResult {
  const [results, setResults] = useState<RowValidationResult[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = useCallback((data: Record<string, string>[]) => {
    try {
      const rowValidator = new RowValidator(validationRules);
      const validationResults = rowValidator.validateAll(data);
      setResults(validationResults);
      setErrors([]);
      return validationResults;
    } catch (err) {
      const errorMessage = String(err);
      setErrors([errorMessage]);
      throw err;
    }
  }, [validationRules]);

  return {
    validate,
    results,
    errors,
  };
}
