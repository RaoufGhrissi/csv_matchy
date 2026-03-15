import { Comparer } from "../enums/comparer";
import { ConditionProperty } from "../enums/condition_property";

export class Condition {
  property: ConditionProperty;
  comparer: Comparer;
  value: number | string | string[];
  custom_fail_message: string | null;

  constructor(
    property: ConditionProperty,
    value: number | string | string[],
    comparer: Comparer = Comparer.e,
    custom_fail_message: string | null = null
  ) {
    this.property = property;
    this.comparer = comparer;
    this.value = value;
    this.custom_fail_message = custom_fail_message;
  }
}
