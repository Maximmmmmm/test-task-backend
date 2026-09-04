import { Injectable } from '@nestjs/common';
import { SalaryCalculationContext } from '../salary.types.js';
import { SalaryCalculationStrategy } from './salary-calculation.strategy.js';

/**
 * salary =
 *   base
 *   + min(base * yearsWorked * 0.01, base * 0.35)
 *   + sum(all descendant salaries) * 0.003
 */
@Injectable()
export class SalesSalaryStrategy implements SalaryCalculationStrategy {
  calculate(context: SalaryCalculationContext): number {
    const { effectiveBaseSalary, fullYearsWorked, descendantSalaries } = context;
    const seniority = Math.min(
      effectiveBaseSalary * fullYearsWorked * 0.01,
      effectiveBaseSalary * 0.35,
    );
    const commission =
      descendantSalaries.reduce((sum, salary) => sum + salary, 0) * 0.003;
    return effectiveBaseSalary + seniority + commission;
  }
}