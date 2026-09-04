import {
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SalaryService } from './salary.service.js';
import { SalaryCycleError } from './salary.types.js';

@ApiTags('salary')
@Controller()
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Get('staff/:id/salary')
  @ApiOperation({ summary: 'Calculate one staff member salary at asOf' })
  @ApiQuery({
    name: 'asOf',
    required: true,
    description: 'ISO calendar date YYYY-MM-DD',
    example: '2026-01-01',
  })
  async getIndividualSalary(
    @Param('id', ParseIntPipe) id: number,
    @Query('asOf') asOf: string,
  ) {
    try {
      const salary = await this.salaryService.getIndividualSalary(id, asOf);
      return { staffId: id, asOf, salary };
    } catch (error) {
      if (error instanceof SalaryCycleError) {
        throw new InternalServerErrorException(error.message);
      }
      throw error;
    }
  }

  @Get('company/total-salary')
  @ApiOperation({ summary: 'Calculate the company total payroll at asOf' })
  @ApiQuery({
    name: 'asOf',
    required: true,
    description: 'ISO calendar date YYYY-MM-DD',
    example: '2026-01-01',
  })
  async getTotalSalary(@Query('asOf') asOf: string) {
    try {
      const totalSalary = await this.salaryService.getTotalSalary(asOf);
      return { asOf, totalSalary };
    } catch (error) {
      if (error instanceof SalaryCycleError) {
        throw new InternalServerErrorException(error.message);
      }
      throw error;
    }
  }
}