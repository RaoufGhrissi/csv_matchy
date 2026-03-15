import { Comparer } from "../models/enums/comparer";

export function isEmpty(value: string | undefined | null) {
  return ["", null, undefined].includes(value);
}

export const evaluateConditions = {
  [Comparer.gt]: (x: number, y: number) => x > y,
  [Comparer.lt]: (x: number, y: number) => x < y,
  [Comparer.e]: (x: number, y: number) => x === y,
  [Comparer.gte]: (x: number, y: number) => x >= y,
  [Comparer.lte]: (x: number, y: number) => x <= y,
  [Comparer.in]: (x: string, y: string[]) => y.map(e => e.toUpperCase()).includes(x.toUpperCase()),
  regExp: (x: string, y: string) => {
    const regex = new RegExp(y);
    return regex.test(x);
  },
};

export const textPerComparer = {
    [Comparer.gt]: "greater than",
    [Comparer.lt]: "lower than",
    [Comparer.e]: "equal",
    [Comparer.gte]: "greater or equal than",
    [Comparer.lte]: "lower or equal than",
    [Comparer.in]: "in"
  };
