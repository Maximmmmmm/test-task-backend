import { Injectable } from '@nestjs/common';
import { SalaryCalculationContext } from '../salary.types.js';
import { SalaryCalculationStrategy } from './salary-calculation.strategy.js';

/**
 * salary = base * (1 + min(yearsWorked * 0.03, 0.30))
 */
@Injectable()
export class EmployeeSalaryStrategy implements SalaryCalculationStrategy {
  calculate(context: SalaryCalculationContext): number {
    const { effectiveBaseSalary, fullYearsWorked } = context;
    const seniority = Math.min(fullYearsWorked * 0.03, 0.3);
    return effectiveBaseSalary * (1 + seniority);
  }
}