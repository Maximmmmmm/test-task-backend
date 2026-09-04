import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidIsoDate } from '../common/date.util.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { StaffEntity } from './entities/staff.entity.js';
import { StaffType } from './enums/staff-type.enum.js';
import { StaffRepository } from './staff.repository.js';

@Injectable()
export class StaffService {
  constructor(private readonly repository: StaffRepository) {}

  async create(dto: CreateStaffDto): Promise<StaffEntity> {
    this.assertValidJoinedAt(dto.joinedAt);
    if (dto.supervisorId !== undefined && dto.supervisorId !== null) {
      await this.assertValidSupervisor(dto.supervisorId, null);
    }

    const staff = this.repository.create({
      name: dto.name,
      joinedAt: dto.joinedAt,
      type: dto.type,
      baseSalaryOverride: dto.baseSalaryOverride ?? null,
      supervisorId: dto.supervisorId ?? null,
    });
    return this.repository.save(staff);
  }

  async findAll(): Promise<StaffEntity[]> {
    return this.repository.findAll();
  }

  async findOne(id: number): Promise<StaffEntity> {
    return this.requireStaff(id);
  }

  async update(id: number, dto: UpdateStaffDto): Promise<StaffEntity> {
    const staff = await this.requireStaff(id);

    if (dto.name !== undefined) {
      staff.name = dto.name;
    }
    if (dto.joinedAt !== undefined) {
      this.assertValidJoinedAt(dto.joinedAt);
      staff.joinedAt = dto.joinedAt;
    }
    if (dto.type !== undefined) {
      if (dto.type === StaffType.EMPLOYEE && staff.type !== StaffType.EMPLOYEE) {
        const subordinateCount = await this.repository.countBySupervisor(id);
        if (subordinateCount > 0) {
          throw new ConflictException('An Employee cannot have subordinates');
        }
      }
      staff.type = dto.type;
    }
    if (dto.baseSalaryOverride !== undefined) {
      staff.baseSalaryOverride = dto.baseSalaryOverride;
    }
    if (dto.supervisorId !== undefined) {
      if (dto.supervisorId !== null) {
        await this.assertValidSupervisor(dto.supervisorId, id);
      }
      staff.supervisorId = dto.supervisorId;
    }

    return this.repository.save(staff);
  }

  async remove(id: number): Promise<void> {
    const staff = await this.requireStaff(id);
    // Remove all direct subordinates' reference before deleting the record.
    await this.repository.clearSupervisorOf(id);
    await this.repository.remove(staff);
  }

  private async requireStaff(id: number): Promise<StaffEntity> {
    const staff = await this.repository.findById(id);
    if (!staff) {
      throw new NotFoundException(`Staff member ${id} not found`);
    }
    return staff;
  }

  private assertValidJoinedAt(joinedAt: string): void {
    if (!isValidIsoDate(joinedAt)) {
      throw new BadRequestException('joinedAt must be a valid date in YYYY-MM-DD format');
    }
  }

  /**
   * Validates a supervisor assignment:
   * - must exist;
   * - must not be the staff member themself;
   * - must not be an Employee (Employees cannot have subordinates);
   * - must not create a cycle in the management hierarchy.
   */
  private async assertValidSupervisor(
    supervisorId: number,
    currentStaffId: number | null,
  ): Promise<void> {
    if (supervisorId === currentStaffId) {
      throw new ConflictException('A staff member cannot supervise themselves');
    }

    const supervisor = await this.repository.findById(supervisorId);
    if (!supervisor) {
      throw new NotFoundException(`Supervisor ${supervisorId} not found`);
    }
    if (supervisor.type === StaffType.EMPLOYEE) {
      throw new ConflictException('An Employee cannot have subordinates');
    }

    // Walk up from the would-be supervisor; reaching `currentStaffId` means
    // assigning would close a cycle.
    const seen = new Set<number>();
    let cursor: number | null = supervisor.id;
    while (cursor !== null) {
      if (cursor === currentStaffId) {
        throw new ConflictException('Hierarchy cycle detected');
      }
      if (seen.has(cursor)) {
        // Defensive: existing data is already corrupted.
        throw new ConflictException('Existing hierarchy contains a cycle');
      }
      seen.add(cursor);
      const current = await this.repository.findById(cursor);
      if (!current) {
        break;
      }
      cursor = current.supervisorId;
    }
  }
}