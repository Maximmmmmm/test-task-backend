import { StaffEntity } from '../../../src/staff/entities/staff.entity.js';
import { StaffType } from '../../../src/staff/enums/staff-type.enum.js';
import { SalesSalaryStrategy } from '../../../src/salary/strategies/sales-salary.strategy.js';
import { SalaryCalculationContext } from '../../../src/salary/salary.types.js';

const strategy = new SalesSalaryStrategy();

function context(overrides: Partial<SalaryCalculationContext>): SalaryCalculationContext {
  return {
    staff: { id: 1, name: 'S', joinedAt: '2020-01-01', type: StaffType.SALES } as StaffEntity,
    asOf: '2025-01-01',
    effectiveBaseSalary: 1000,
    fullYearsWorked: 0,
    directSubordinateSalaries: [],
    descendantSalaries: [],
    ...overrides,
  };
}

describe('SalesSalaryStrategy', () => {
  it('returns base salary with 0 years and no subordinates', () => {
    expect(strategy.calculate(context({}))).toBe(1000);
  });

  it('adds 1% seniority per full year', () => {
    expect(strategy.calculate(context({ fullYearsWorked: 5 }))).toBe(1050);
  });

  it('caps seniority at 35%', () => {
    expect(strategy.calculate(context({ fullYearsWorked: 35 }))).toBe(1350);
    expect(strategy.calculate(context({ fullYearsWorked: 40 }))).toBe(1350);
  });

  it('adds 0.3% of descendant subordinate salaries', () => {
    expect(
      strategy.calculate(
        context({ fullYearsWorked: 5, directSubordinateSalaries: [1000], descendantSalaries: [1000] }),
      ),
    ).toBe(1053);
  });

  it('sums ALL descendant salaries across multiple levels', () => {
    // Direct: [1000]; deeper descendants: [500, 300]. All must contribute.
    const salary = strategy.calculate(
      context({
        fullYearsWorked: 0,
        directSubordinateSalaries: [1000],
        descendantSalaries: [1000, 500, 300],
      }),
    );
    expect(salary).toBe(1000 + 1800 * 0.003);
  });

  it('excludes the sales member own salary from the descendant total', () => {
    // descendantSalaries are provided already excluding self by orchestration;
    // passing a self-like salary here must still only use the provided list.
    const salary = strategy.calculate(
      context({ fullYearsWorked: 0, descendantSalaries: [1000, 1000] }),
    );
    expect(salary).toBe(1000 + 2000 * 0.003);
  });
});