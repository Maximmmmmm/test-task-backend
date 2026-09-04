import { StaffEntity } from '../staff/entities/staff.entity.js';


export interface SalaryCalculationContext {
  staff: StaffEntity;
  asOf: string;
  effectiveBaseSalary: number;
  fullYearsWorked: number;
  directSubordinateSalaries: number[];
  descendantSalaries: number[];
}

export interface NodeCalculation {
  staff: StaffEntity;
  salary: number;
  effectiveBaseSalary: number;
  fullYearsWorked: number;
  descendantSalaries: number[];
}


export class SalaryCycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalaryCycleError';
  }
}


export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}