import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompanyService } from '../../../src/company/company.service.js';
import { StaffEntity } from '../../../src/staff/entities/staff.entity.js';
import { StaffType } from '../../../src/staff/enums/staff-type.enum.js';
import { StaffRepository } from '../../../src/staff/staff.repository.js';
import { SalaryCalculatorFactory } from '../../../src/salary/salary-calculator.factory.js';
import { SalaryService } from '../../../src/salary/salary.service.js';
import { SalaryCycleError } from '../../../src/salary/salary.types.js';
import { EmployeeSalaryStrategy } from '../../../src/salary/strategies/employee-salary.strategy.js';
import { ManagerSalaryStrategy } from '../../../src/salary/strategies/manager-salary.strategy.js';
import { SalesSalaryStrategy } from '../../../src/salary/strategies/sales-salary.strategy.js';

function staff(
  id: number,
  type: StaffType,
  supervisorId: number | null,
  baseSalaryOverride: number | null = null,
): StaffEntity {
  return {
    id,
    name: `Member ${id}`,
    joinedAt: '2020-01-01',
    type,
    baseSalaryOverride,
    supervisorId,
  };
}

/**
 * Fixture (all joined 2020-01-01, implicit asOf 2025-01-01 => 5 years):
 *
 * Manager A
 *  ├── Employee B
 *  ├── Sales C
 *  │   └── Employee D
 *  └── Manager E
 *      └── Employee F
 */
function fixture(): StaffEntity[] {
  return [
    staff(1, StaffType.MANAGER, null),
    staff(2, StaffType.EMPLOYEE, 1),
    staff(3, StaffType.SALES, 1),
    staff(4, StaffType.EMPLOYEE, 3),
    staff(5, StaffType.MANAGER, 1),
    staff(6, StaffType.EMPLOYEE, 5),
  ];
}

function createService(
  allStaff: StaffEntity[],
  defaultBaseSalary = 1000,
  factory?: SalaryCalculatorFactory,
): SalaryService {
  const repo = {
    findAll: async () => allStaff,
    findById: async (id: number) => allStaff.find((s) => s.id === id) ?? null,
  } as unknown as StaffRepository;
  const company = {
    getDefaultBaseSalary: async () => defaultBaseSalary,
  } as unknown as CompanyService;
  if (!factory) {
    factory = new SalaryCalculatorFactory(
      new EmployeeSalaryStrategy(),
      new ManagerSalaryStrategy(),
      new SalesSalaryStrategy(),
    );
  }
  return new SalaryService(repo, company, factory);
}

describe('SalaryService', () => {
  const asOf = '2025-01-01';

  describe('getIndividualSalary', () => {
    it('calculates a leaf Employee salary (5 years => 1150)', async () => {
      const service = createService(fixture());
      await expect(service.getIndividualSalary(2, asOf)).resolves.toBe(1150);
    });

    it('calculates a Sales salary using all descendants (1053.45)', async () => {
      const service = createService(fixture());
      const salary = await service.getIndividualSalary(3, asOf);
      expect(salary).toBeCloseTo(1053.45, 5);
    });

    it('calculates a nested Manager salary (1267.30)', async () => {
      const service = createService(fixture());
      const salary = await service.getIndividualSalary(1, asOf);
      expect(salary).toBeCloseTo(1267.3, 5);
    });

    it('uses the base salary override when present', async () => {
      const all = fixture();
      all.push(staff(7, StaffType.EMPLOYEE, null, 2000));
      const service = createService(all);
      await expect(service.getIndividualSalary(7, asOf)).resolves.toBe(2300);
    });

    it('throws NotFound for unknown staff', async () => {
      const service = createService(fixture());
      await expect(service.getIndividualSalary(999, asOf)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a malformed asOf', async () => {
      const service = createService(fixture());
      await expect(service.getIndividualSalary(2, '2025/01/01')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.getIndividualSalary(2, '')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects asOf earlier than joinedAt', async () => {
      const service = createService(fixture());
      await expect(service.getIndividualSalary(2, '2019-12-31')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getTotalSalary', () => {
    it('sums each staff member exactly once (7026.50)', async () => {
      const service = createService(fixture());
      const total = await service.getTotalSalary(asOf);
      expect(total).toBeCloseTo(7026.5, 5);
    });

    it('returns 0 when there is no staff', async () => {
      const service = createService([]);
      await expect(service.getTotalSalary(asOf)).resolves.toBe(0);
    });

    it('rejects a malformed asOf', async () => {
      const service = createService(fixture());
      await expect(service.getTotalSalary('2025-13-01')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('memoization and cycle defense', () => {
    it('calculates each member exactly once for a total', async () => {
      const allStaff = fixture();
      const calls = { count: 0 };
      const countingStrategy = { calculate: () => (calls.count += 1, 100) };
      const factory = {
        get: () => countingStrategy,
      } as unknown as SalaryCalculatorFactory;

      const service = createService(allStaff, 1000, factory);
      await service.getTotalSalary(asOf);
      expect(calls.count).toBe(6);
    });

    it('detects a corrupted cyclic hierarchy and fails defensively', async () => {
      const cyclic = [staff(1, StaffType.MANAGER, 2), staff(2, StaffType.SALES, 1)];
      const service = createService(cyclic);
      await expect(service.getTotalSalary(asOf)).rejects.toBeInstanceOf(SalaryCycleError);
    });
  });
describe('additional coverage', () => {
    it('is deterministic for an arbitrary asOf (2024-06-30 => 4 years)', async () => {
      const service = createService([staff(7, StaffType.EMPLOYEE, null)]);
      await expect(service.getIndividualSalary(7, '2024-06-30')).resolves.toBe(1120);
    });

    it('counts exactly at the anniversary boundary', async () => {
      const service = createService([staff(7, StaffType.EMPLOYEE, null)]);
      await expect(service.getIndividualSalary(7, '2024-01-01')).resolves.toBe(1120);
      await expect(service.getIndividualSalary(7, '2023-12-31')).resolves.toBe(1090);
    });

    it('handles multiple top-level branches without double counting', async () => {
      const roots = [
        staff(1, StaffType.MANAGER, null),
        staff(2, StaffType.EMPLOYEE, 1),
        staff(3, StaffType.MANAGER, null),
        staff(4, StaffType.EMPLOYEE, 3),
      ];
      const service = createService(roots);
      const total = await service.getTotalSalary(asOf);
      // E1=1150, E2=1150, M1=M2=1255.75 each
      expect(total).toBeCloseTo(4811.5, 5);
    });

    it('calculates a Manager with no subordinates', async () => {
      const service = createService([staff(5, StaffType.MANAGER, null)]);
      await expect(service.getIndividualSalary(5, asOf)).resolves.toBe(1250);
    });

    it('calculates a Sales member with no subordinates', async () => {
      const service = createService([staff(6, StaffType.SALES, null)]);
      await expect(service.getIndividualSalary(6, asOf)).resolves.toBe(1050);
    });
  });
});