import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffEntity } from './entities/staff.entity.js';
import { StaffController } from './staff.controller.js';
import { StaffRepository } from './staff.repository.js';
import { StaffService } from './staff.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([StaffEntity])],
  controllers: [StaffController],
  providers: [StaffService, StaffRepository],
  exports: [StaffService, StaffRepository],
})
export class StaffModule {}