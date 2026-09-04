import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { StaffEntity } from './entities/staff.entity.js';

/**
 * Focused repository abstraction around the TypeORM staff repository.
 * Keeps the salary logic free of ORM query details.
 */
@Injectable()
export class StaffRepository {
  constructor(
    @InjectRepository(StaffEntity)
    private readonly repo: Repository<StaffEntity>,
  ) {}

  findAll(): Promise<StaffEntity[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<StaffEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(entityLike: DeepPartial<StaffEntity>): StaffEntity {
    return this.repo.create(entityLike);
  }

  save(staff: StaffEntity): Promise<StaffEntity> {
    return this.repo.save(staff);
  }

  remove(staff: StaffEntity): Promise<StaffEntity> {
    return this.repo.remove(staff);
  }

  countBySupervisor(supervisorId: number): Promise<number> {
    return this.repo.count({ where: { supervisorId } });
  }

  /** Unassigns all direct subordinates of the given supervisor. */
  async clearSupervisorOf(supervisorId: number): Promise<void> {
    await this.repo.update({ supervisorId }, { supervisorId: null });
  }
}