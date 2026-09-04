import { Module } from '@nestjs/common';
import { CompanyModule } from '../company/company.module.js';
import { StaffModule } from '../staff/staff.module.js';
import { SalaryCalculatorFactory } from './salary-calculator.factory.js';
import { SalaryController } from './salary.controller.js';
import { SalaryService } from './salary.service.js';
import { EmployeeSalaryStrategy } from './strategies/employee-salary.strategy.js';
import { ManagerSalaryStrategy } from './strategies/manager-salary.strategy.js';
import { SalesSalaryStrategy } from './strategies/sales-salary.strategy.js';

@Module({
  imports: [StaffModule, CompanyModule],
  controllers: [SalaryController],
  providers: [
    SalaryService,
    SalaryCalculatorFactory,
    EmployeeSalaryStrategy,
    ManagerSalaryStrategy,
    SalesSalaryStrategy,
  ],
  exports: [SalaryService],
})
export class SalaryModule {}