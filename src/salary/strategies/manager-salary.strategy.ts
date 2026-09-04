import { Injectable } from '@nestjs/common';
import { SalaryCalculationContext } from '../salary.types.js';
import { SalaryCalculationStrategy } from './salary-calculation.strategy.js';

/**
 * salary =
 *   base
 *   + min(base * yearsWorked * 0.05, base * 0.40)
 *   + sum(first-level subordinate salaries) * 0.005
 */
@Injectable()
export class ManagerSalaryStrategy implements SalaryCalculationStrategy {
  calculate(context: SalaryCalculationContext): number {
    const { effectiveBaseSalary, fullYearsWorked, directSubordinateSalaries } = context;
    const seniority = Math.min(
      effectiveBaseSalary * fullYearsWorked * 0.05,
      effectiveBaseSalary * 0.4,
    );
    const managementBonus =
      directSubordinateSalaries.reduce((sum, salary) => sum + salary, 0) * 0.005;
    return effectiveBaseSalary + seniority + managementBonus;
  }
}