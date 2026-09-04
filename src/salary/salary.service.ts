import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyService } from '../company/company.service.js';
import { fullYearsWorked, isDateBefore, isValidIsoDate } from '../common/date.util.js';
import { StaffEntity } from '../staff/entities/staff.entity.js';
import { StaffRepository } from '../staff/staff.repository.js';
import { SalaryCalculatorFactory } from './salary-calculator.factory.js';
import { NodeCalculation, round2, SalaryCycleError } from './salary.types.js';

/**
 * Orchestrates salary calculation.
 *
 * Responsibilities:
 * - loads the staff hierarchy and the company configuration;
 * - validates `asOf` and per-member `joinedAt` dates;
 * - performs a memoized post-order (children-first) traversal;
 * - builds the strategy context (direct/descendant salaries at the same asOf);
 * - rounds every final salary to two decimal places.
 *
 * The staff-type-specific formulas live in the strategies, NOT here.
 */
@Injectable()
export class SalaryService {
  constructor(
    private readonly staffRepository: StaffRepository,
    private readonly companyService: CompanyService,
    private readonly factory: SalaryCalculatorFactory,
  ) {}

  async getIndividualSalary(id: number, asOf: string): Promise<number> {
    this.assertAsOf(asOf);
    const target = await this.staffRepository.findById(id);
    if (!target) {
      throw new NotFoundException(`Staff member ${id} not found`);
    }
    const defaultBaseSalary = await this.companyService.getDefaultBaseSalary();
    const allStaff = await this.staffRepository.findAll();
    const childrenMap = buildChildrenMap(allStaff);
    const result = this.calculateNode(
      target,
      asOf,
      childrenMap,
      new Map<number, NodeCalculation>(),
      new Set<number>(),
      defaultBaseSalary,
    );
    return result.salary;
  }

  async getTotalSalary(asOf: string): Promise<number> {
    this.assertAsOf(asOf);
    const allStaff = await this.staffRepository.findAll();
    if (allStaff.length === 0) {
      return 0;
    }
    const defaultBaseSalary = await this.companyService.getDefaultBaseSalary();
    const childrenMap = buildChildrenMap(allStaff);
    const memo = new Map<number, NodeCalculation>();
    for (const staff of allStaff) {
      this.calculateNode(staff, asOf, childrenMap, memo, new Set<number>(), defaultBaseSalary);
    }
    let total = 0;
    for (const calculation of memo.values()) {
      total += calculation.salary;
    }
    return round2(total);
  }

  /**
   * Recursively calculates a staff member's salary at `asOf`.
   *
   * Children are always calculated before their supervisor (post-order) and
   * results are memoized per request, so each member is computed exactly once
   * and the total payroll is not double-counted.
   */
  private calculateNode(
    staff: StaffEntity,
    asOf: string,
    childrenMap: Map<number, StaffEntity[]>,
    memo: Map<number, NodeCalculation>,
    path: Set<number>,
    defaultBaseSalary: number,
  ): NodeCalculation {
    const cached = memo.get(staff.id);
    if (cached) {
      return cached;
    }
    if (path.has(staff.id)) {
      throw new SalaryCycleError(
        `Cyclic hierarchy detected while calculating salary for staff member ${staff.id}`,
      );
    }

    if (isDateBefore(asOf, staff.joinedAt)) {
      throw new BadRequestException(
        `asOf must not be earlier than joinedAt (staff ${staff.id}, joinedAt ${staff.joinedAt})`,
      );
    }

    path.add(staff.id);

    const children = childrenMap.get(staff.id) ?? [];
    const directSubordinateSalaries: number[] = [];
    const descendantSalaries: number[] = [];
    for (const child of children) {
      const childCalculation = this.calculateNode(
        child,
        asOf,
        childrenMap,
        memo,
        path,
        defaultBaseSalary,
      );
      directSubordinateSalaries.push(childCalculation.salary);
      descendantSalaries.push(childCalculation.salary, ...childCalculation.descendantSalaries);
    }

    const effectiveBaseSalary = staff.baseSalaryOverride ?? defaultBaseSalary;
    const yearsWorked = fullYearsWorked(staff.joinedAt, asOf);
    const salary = this.factory.get(staff.type).calculate({
      staff,
      asOf,
      effectiveBaseSalary,
      fullYearsWorked: yearsWorked,
      directSubordinateSalaries,
      descendantSalaries,
    });

    const calculation: NodeCalculation = {
      staff,
      salary: round2(salary),
      effectiveBaseSalary,
      fullYearsWorked: yearsWorked,
      descendantSalaries,
    };

    path.delete(staff.id);
    memo.set(staff.id, calculation);
    return calculation;
  }

  private assertAsOf(asOf: string): void {
    if (!asOf) {
      throw new BadRequestException('asOf is required (YYYY-MM-DD)');
    }
    if (!isValidIsoDate(asOf)) {
      throw new BadRequestException('asOf must be a valid date in YYYY-MM-DD format');
    }
  }
}

function buildChildrenMap(allStaff: StaffEntity[]): Map<number, StaffEntity[]> {
  const childrenMap = new Map<number, StaffEntity[]>();
  for (const staff of allStaff) {
    if (staff.supervisorId !== null && staff.supervisorId !== undefined) {
      const siblings = childrenMap.get(staff.supervisorId) ?? [];
      siblings.push(staff);
      childrenMap.set(staff.supervisorId, siblings);
    }
  }
  return childrenMap;
}