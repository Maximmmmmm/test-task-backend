import { Injectable } from '@nestjs/common';
import { StaffType } from '../staff/enums/staff-type.enum.js';
import { EmployeeSalaryStrategy } from './strategies/employee-salary.strategy.js';
import { ManagerSalaryStrategy } from './strategies/manager-salary.strategy.js';
import { SalaryCalculationStrategy } from './strategies/salary-calculation.strategy.js';
import { SalesSalaryStrategy } from './strategies/sales-salary.strategy.js';

@Injectable()
export class SalaryCalculatorFactory {
  constructor(
    private readonly employeeStrategy: EmployeeSalaryStrategy,
    private readonly managerStrategy: ManagerSalaryStrategy,
    private readonly salesStrategy: SalesSalaryStrategy,
  ) {}

  get(type: StaffType): SalaryCalculationStrategy {
    switch (type) {
      case StaffType.EMPLOYEE:
        return this.employeeStrategy;
      case StaffType.MANAGER:
        return this.managerStrategy;
      case StaffType.SALES:
        return this.salesStrategy;
      default:
        throw new Error(`Unsupported staff type: ${String(type)}`);
    }
  }
}