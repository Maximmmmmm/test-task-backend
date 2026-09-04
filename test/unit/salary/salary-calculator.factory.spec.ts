import { SalaryCalculatorFactory } from '../../../src/salary/salary-calculator.factory.js';
import { EmployeeSalaryStrategy } from '../../../src/salary/strategies/employee-salary.strategy.js';
import { ManagerSalaryStrategy } from '../../../src/salary/strategies/manager-salary.strategy.js';
import { SalesSalaryStrategy } from '../../../src/salary/strategies/sales-salary.strategy.js';
import { StaffType } from '../../../src/staff/enums/staff-type.enum.js';

describe('SalaryCalculatorFactory', () => {
  const factory = new SalaryCalculatorFactory(
    new EmployeeSalaryStrategy(),
    new ManagerSalaryStrategy(),
    new SalesSalaryStrategy(),
  );

  it('returns the Employee strategy for EMPLOYEE', () => {
    expect(factory.get(StaffType.EMPLOYEE)).toBeInstanceOf(EmployeeSalaryStrategy);
  });

  it('returns the Manager strategy for MANAGER', () => {
    expect(factory.get(StaffType.MANAGER)).toBeInstanceOf(ManagerSalaryStrategy);
  });

  it('returns the Sales strategy for SALES', () => {
    expect(factory.get(StaffType.SALES)).toBeInstanceOf(SalesSalaryStrategy);
  });

  it('fails clearly for an unsupported type', () => {
    expect(() => factory.get('UNKNOWN' as StaffType)).toThrow(/Unsupported staff type/);
  });
});