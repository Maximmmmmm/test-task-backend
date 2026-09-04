import { StaffEntity } from '../../../src/staff/entities/staff.entity.js';
import { StaffType } from '../../../src/staff/enums/staff-type.enum.js';
import { EmployeeSalaryStrategy } from '../../../src/salary/strategies/employee-salary.strategy.js';
import { SalaryCalculationContext } from '../../../src/salary/salary.types.js';

const strategy = new EmployeeSalaryStrategy();

function context(overrides: Partial<SalaryCalculationContext>): SalaryCalculationContext {
  return {
    staff: { id: 1, name: 'A', joinedAt: '2020-01-01', type: StaffType.EMPLOYEE } as StaffEntity,
    asOf: '2025-01-01',
    effectiveBaseSalary: 1000,
    fullYearsWorked: 0,
    directSubordinateSalaries: [],
    descendantSalaries: [],
    ...overrides,
  };
}

describe('EmployeeSalaryStrategy', () => {
  it('returns base salary with 0 full years', () => {
    expect(strategy.calculate(context({ fullYearsWorked: 0 }))).toBe(1000);
  });

  it('adds 3% per full year', () => {
    expect(strategy.calculate(context({ fullYearsWorked: 5 }))).toBe(1150);
  });

  it('caps seniority at 30% (10+ years)', () => {
    expect(strategy.calculate(context({ fullYearsWorked: 10 }))).toBe(1300);
    expect(strategy.calculate(context({ fullYearsWorked: 20 }))).toBe(1300);
    expect(strategy.calculate(context({ fullYearsWorked: 40 }))).toBe(1300);
  });

  it('ignores subordinate salaries entirely', () => {
    expect(
      strategy.calculate(
        context({
          fullYearsWorked: 5,
          directSubordinateSalaries: [1000],
          descendantSalaries: [1000, 500],
        }),
      ),
    ).toBe(1150);
  });

  it('uses the effective base salary (override)', () => {
    expect(
      strategy.calculate(context({ effectiveBaseSalary: 2000, fullYearsWorked: 5 })),
    ).toBe(2300);
  });
});