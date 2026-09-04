import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyModule } from './company/company.module.js';
import { CompanyEntity } from './company/entities/company.entity.js';
import { resolveDatabasePath } from './database/database.config.js';
import { SalaryModule } from './salary/salary.module.js';
import { StaffModule } from './staff/staff.module.js';
import { StaffEntity } from './staff/entities/staff.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'better-sqlite3',
        database: resolveDatabasePath(),
        entities: [CompanyEntity, StaffEntity],
        synchronize: true,
      }),
    }),
    CompanyModule,
    StaffModule,
    SalaryModule,
  ],
})
export class AppModule {}
