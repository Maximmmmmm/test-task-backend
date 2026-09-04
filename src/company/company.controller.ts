import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompanyService } from './company.service.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@ApiTags('company')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  getCompany() {
    return this.companyService.getCompany();
  }

  @Patch()
  update(@Body() dto: UpdateCompanyDto) {
    return this.companyService.update(dto);
  }
}