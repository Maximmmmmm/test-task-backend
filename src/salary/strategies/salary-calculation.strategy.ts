import { SalaryCalculationContext } from '../salary.types.js';

export interface SalaryCalculationStrategy {
  calculate(context: SalaryCalculationContext): number;
}