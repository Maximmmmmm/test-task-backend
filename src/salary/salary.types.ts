import { StaffEntity } from '../staff/entities/staff.entity.js';

/**
 * Input received by a salary strategy. Subordinate salaries are already
 * calculated at the same `asOf` date by the orchestrating `SalaryCalculator`.
 */
export interface SalaryCalculationContext {
  staff: StaffEntity;
  /** ISO calendar date `YYYY-MM-DD`. */
  asOf: string;
  effectiveBaseSalary: number;
  fullYearsWorked: number;
  /** First-level subordinate salaries at `asOf`. */
  directSubordinateSalaries: number[];
  /** Salaries of all subordinates at any depth (excluding the member themself). */
  descendantSalaries: number[];
}

/** Result of one staff member salary computation. */
export interface NodeCalculation {
  staff: StaffEntity;
  salary: number;
  effectiveBaseSalary: number;
  fullYearsWorked: number;
  /** Salaries of all subordinates at any depth (excluding the member themself). */
  descendantSalaries: number[];
}

/** Raised when the persisted hierarchy is corrupted with a cycle. */
export class SalaryCycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalaryCycleError';
  }
}

/**
 * Documented money policy: JavaScript numbers, final salary rounded to two
 * decimal places. The same policy is applied to individual and total salary.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}