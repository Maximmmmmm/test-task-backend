import { SalaryCalculationContext } from '../salary.types.js';

/** A staff-type-specific salary formula. Implementations must be pure. */
export interface SalaryCalculationStrategy {
  calculate(context: SalaryCalculationContext): number;
}