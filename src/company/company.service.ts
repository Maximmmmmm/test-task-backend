import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { COMPANY_ID, DEFAULT_BASE_SALARY, DEFAULT_COMPANY_NAME } from './company.constants.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { CompanyEntity } from './entities/company.entity.js';

@Injectable()
export class CompanyService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureDefaultCompany();
  }

  /** Seeds the single company record (idempotent). */
  async ensureDefaultCompany(): Promise<void> {
    const count = await this.companyRepo.count();
    if (count === 0) {
      await this.companyRepo.save(
        this.companyRepo.create({
          id: COMPANY_ID,
          name: DEFAULT_COMPANY_NAME,
          defaultBaseSalary: DEFAULT_BASE_SALARY,
        }),
      );
    }
  }

  async getCompany(): Promise<CompanyEntity> {
    const company = await this.companyRepo.findOne({ where: { id: COMPANY_ID } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(dto: UpdateCompanyDto): Promise<CompanyEntity> {
    const company = await this.getCompany();
    if (dto.name !== undefined) {
      company.name = dto.name;
    }
    if (dto.defaultBaseSalary !== undefined) {
      company.defaultBaseSalary = dto.defaultBaseSalary;
    }
    return this.companyRepo.save(company);
  }

  async getDefaultBaseSalary(): Promise<number> {
    return (await this.getCompany()).defaultBaseSalary;
  }
}