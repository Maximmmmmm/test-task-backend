import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { StaffEntity } from '../../../src/staff/entities/staff.entity.js';
import { StaffType } from '../../../src/staff/enums/staff-type.enum.js';
import { StaffRepository } from '../../../src/staff/staff.repository.js';
import { StaffService } from '../../../src/staff/staff.service.js';

function staff(partial: Partial<StaffEntity>): StaffEntity {
  return {
    id: 1,
    name: 'Test',
    joinedAt: '2020-01-01',
    type: StaffType.MANAGER,
    baseSalaryOverride: null,
    supervisorId: null,
    ...partial,
  };
}

function createRepositoryMock(overrides: Partial<Record<keyof StaffRepository, unknown>> = {}) {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn((entityLike: Partial<StaffEntity>) => staff(entityLike)),
    save: vi.fn(async (entity: StaffEntity) => entity),
    remove: vi.fn(async (entity: StaffEntity) => entity),
    countBySupervisor: vi.fn(async () => 0),
    clearSupervisorOf: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as StaffRepository;
}

describe('StaffService', () => {
  let service: StaffService;
  let repo: ReturnType<typeof createRepositoryMock>;

  beforeEach(() => {
    repo = createRepositoryMock();
    service = new StaffService(repo);
  });

  describe('create', () => {
    it('creates a valid staff member with no supervisor', async () => {
      await service.create({
        name: 'Alice',
        joinedAt: '2020-01-01',
        type: StaffType.EMPLOYEE,
      });
      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('rejects an invalid joinedAt calendar date', async () => {
      await expect(
        service.create({ name: 'Alice', joinedAt: '2020-02-30', type: StaffType.EMPLOYEE }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('rejects a missing supervisor', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(
        service.create({
          name: 'Alice',
          joinedAt: '2020-01-01',
          type: StaffType.MANAGER,
          supervisorId: 99,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an Employee as supervisor', async () => {
      repo.findById.mockResolvedValueOnce(staff({ id: 7, type: StaffType.EMPLOYEE }));
      await expect(
        service.create({
          name: 'Alice',
          joinedAt: '2020-01-01',
          type: StaffType.MANAGER,
          supervisorId: 7,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
it('creates a staff member under a valid Sales supervisor', async () => {
      repo.findById.mockResolvedValueOnce(staff({ id: 9, type: StaffType.SALES }));
      await service.create({
        name: 'Alice',
        joinedAt: '2020-01-01',
        type: StaffType.EMPLOYEE,
        supervisorId: 9,
      });
      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(repo.save.mock.calls[0][0].supervisorId).toBe(9);
    });

    it('creates with an explicit base salary override', async () => {
      await service.create({
        name: 'Alice',
        joinedAt: '2020-01-01',
        type: StaffType.EMPLOYEE,
        baseSalaryOverride: 2500,
      });
      expect(repo.save.mock.calls[0][0].baseSalaryOverride).toBe(2500);
    });
  });
describe('update', () => {
    let existing: StaffEntity;

    beforeEach(() => {
      existing = staff({ id: 3, type: StaffType.MANAGER });
      repo.findById.mockImplementation(async (id: number) => {
        if (id === 3) {
          return existing;
        }
        if (id === 10) {
          return staff({ id: 10, type: StaffType.SALES, supervisorId: 20 });
        }
        if (id === 20) {
          return staff({ id: 20, type: StaffType.MANAGER, supervisorId: 3 });
        }
        return null;
      });
    });

    it('updates name', async () => {
      repo.findById.mockReset();
      repo.findById
        .mockResolvedValueOnce(staff({ id: 3, type: StaffType.MANAGER }))
        .mockResolvedValueOnce(existing);
      const result = await service.update(3, { name: 'Bob' });
      expect(result.name).toBe('Bob');
    });

    it('rejects assigning the staff member as their own supervisor', async () => {
      await expect(service.update(3, { supervisorId: 3 })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects a supervisor change that would create a cycle', async () => {
      // Chain: 3 -> 10 -> 20 -> 3. Assigning 3 under 10 closes the cycle.
      await expect(service.update(3, { supervisorId: 10 })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects downgrading to Employee while having subordinates', async () => {
      repo.countBySupervisor.mockResolvedValueOnce(2);
      await expect(service.update(3, { type: StaffType.EMPLOYEE })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('clears the supervisor when null is provided', async () => {
      existing = staff({ id: 3, type: StaffType.MANAGER, supervisorId: 10 });
      repo.findById.mockImplementation(async (id: number) => (id === 3 ? existing : null));
      const result = await service.update(3, { supervisorId: null });
      expect(result.supervisorId).toBeNull();
    });
  });

  describe('remove', () => {
    it('clears subordinates and deletes the staff member', async () => {
      repo.findById.mockResolvedValueOnce(staff({ id: 5, type: StaffType.MANAGER }));
      await service.remove(5);
      expect(repo.clearSupervisorOf).toHaveBeenCalledWith(5);
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });

    it('throws NotFound for an unknown staff member', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('returns the staff member', async () => {
      repo.findById.mockResolvedValueOnce(staff({ id: 3 }));
      const result = await service.findOne(3);
      expect(result.id).toBe(3);
    });

    it('throws NotFound for an unknown staff member', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.findOne(3)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});