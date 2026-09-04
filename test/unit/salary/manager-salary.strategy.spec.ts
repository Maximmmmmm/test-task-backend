import { StaffEntity } from '../../../src/staff/entities/staff.entity.js';
import { StaffType } from '../../../src/staff/enums/staff-type.enum.js';
import { ManagerSalaryStrategy } from '../../../src/salary/strategies/manager-salary.strategy.js';
import { SalaryCalculationContext } from '../../../src/salary/salary.types.js';

const strategy = new ManagerSalaryStrategy();

function context(overrides: Partial<SalaryCalculationContext>): SalaryCalculationContext {
  return {
    staff: { id: 1, name: 'M', joinedAt: '2020-01-01', type: StaffType.MANAGER } as StaffEntity,
    asOf: '2025-01-01',
    effectiveBaseSalary: 1000,
    fullYearsWorked: 0,
    directSubordinateSalaries: [],
    descendantSalaries: [],
    ...overrides,
  };
}

describe('ManagerSalaryStrategy', () => {
  it('returns base salary with 0 years and no subordinates', () => {
    expect(strategy.calculate(context({}))).toBe(1000);
  });

  it('adds 5% seniority per full year', () => {
    expect(strategy.calculate(context({ fullYearsWorked: 5 }))).toBe(1250);
  });

  it('caps seniority at 40%', () => {
    expect(strategy.calculate(context({ fullYearsWorked: 8 }))).toBe(1400);
    expect(strategy.calculate(context({ fullYearsWorked: 20 }))).toBe(1400);
  });

  it('adds 0.5% of direct subordinate salaries', () => {
    expect(
      strategy.calculate(context({ fullYearsWorked: 5, directSubordinateSalaries: [1000] })),
    ).toBe(1255);
  });

  it('sums multiple direct subordinates', () => {
    expect(
      strategy.calculate(
        context({ fullYearsWorked: 0, directSubordinateSalaries: [1000, 2000, 3000] }),
      ),
    ).toBe(1030);
  });

  it('uses only FIRST-LEVEL subordinate salaries, never deeper descendants', () => {
    // Manager has one direct subordinate whose own salary is 1120; deeper
    // descendants exist with salaries 500 and 600. Only 1120 may contribute.
    const salary = strategy.calculate(
      context({
        fullYearsWorked: 0,
        directSubordinateSalaries: [1120],
        descendantSalaries: [1120, 500, 600],
      }),
    );
    expect(salary).toBe(1000 + 1120 * 0.005);
    expect(salary).not.toBe(1000 + (1120 + 500 + 600) * 0.005);
  });
});