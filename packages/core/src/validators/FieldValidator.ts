import { Condition } from "../models/classes/condition";
import { Comparer } from "../models/enums/comparer";
import { ConditionProperty } from "../models/enums/condition_property";
import { FieldType } from "../models/enums/field_type";
import { Option } from "../models/classes/option";
import { evaluateConditions, isEmpty, textPerComparer } from "./validation-utils";

export interface ValidationError {
  field: string;
  message: string;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class FieldValidator {
  validateMandatory(value: string, fieldName: string): ValidationError | null {
    if (isEmpty(value)) {
      return { field: fieldName, message: "Mandatory field missing" };
    }
    return null;
  }

  validateType(value: string, type: FieldType): { valid: boolean; message: string } {
    if (type === FieldType.integer) {
      const isValid = this.isValidInteger(value);
      return isValid ? { valid: true, message: "" } : { valid: false, message: "It's not a valid integer" };
    } else if (type === FieldType.float) {
      const isValid = this.isValidFloat(value);
      return isValid ? { valid: true, message: "" } : { valid: false, message: "It's not a valid float" };
    } else if (type === FieldType.bool) {
      const isValid = ["Yes", "No"].includes(value);
      return isValid ? { valid: true, message: "" } : { valid: false, message: "Possible values are 'Yes' or 'No'" };
    }
    return { valid: true, message: "" };
  }

  validateConditions(value: string, conditions: Condition[], fieldName: string): ValidationError[] {
    const errors: ValidationError[] = [];
    for (const condition of conditions) {
      if (!this.checkConstraint(value, condition)) {
        errors.push({
          field: fieldName,
          message: this.getInvalidCheckMessage(condition)
        });
      }
    }
    return errors;
  }

  validate(value: string, option: Option, fieldName: string): FieldValidationResult {
    const errors: ValidationError[] = [];

    const mandatoryError = this.validateMandatory(value, fieldName);
    if (mandatoryError) {
      if (option.mandatory) {
        errors.push(mandatoryError);
      }
      return { isValid: errors.length === 0, errors };
    }

    const typeResult = this.validateType(value, option.type);
    if (!typeResult.valid) {
      errors.push({ field: fieldName, message: typeResult.message });
      return { isValid: false, errors };
    }

    const conditionErrors = this.validateConditions(value, option.conditions, fieldName);
    errors.push(...conditionErrors);

    return { isValid: errors.length === 0, errors };
  }

  isValidInteger(value: string): boolean {
    const intValue = parseInt(value, 10);
    return !isNaN(intValue) && value === intValue.toString();
  }

  isValidFloat(value: string): boolean {
    return !isNaN(Number(value)) && value.trim() !== '';
  }

  checkConstraint(value: string, condition: Condition): boolean {
    if (condition.property === ConditionProperty.length) {
      if (condition.comparer === Comparer.in) {
        return evaluateConditions[condition.comparer](
          String(value.length),
          condition.value as string[]
        );
      }
      return evaluateConditions[condition.comparer](
        value.length,
        Number(condition.value)
      );
    } else if (condition.property === ConditionProperty.value) {
      if (condition.comparer === Comparer.in) {
        return evaluateConditions[Comparer.in](
          value,
          condition.value as string[]
        );
      }
      return evaluateConditions[condition.comparer](
        Number(value),
        Number(condition.value)
      );
    } else if (condition.property === ConditionProperty.regex) {
      return this.checkRegExpConditions(value, String(condition.value));
    }
    return true;
  }

  checkRegExpConditions(value: string, conditionValue: string): boolean {
    return evaluateConditions["regExp"](value, conditionValue);
  }

  getInvalidCheckMessage(condition: Condition): string {
    if (!isEmpty(condition.custom_fail_message)) {
      return condition.custom_fail_message as string;
    } else if (condition.property === ConditionProperty.regex) {
      return `Text doesn't match the regex pattern ${condition.value}`;
    } else if (condition.property === ConditionProperty.length) {
      return `Text length is not ${textPerComparer[condition.comparer]} ${condition.value}`;
    } else if (condition.property === ConditionProperty.value) {
      return `Value is not ${textPerComparer[condition.comparer]} ${condition.value}`;
    }
    return "";
  }
}
