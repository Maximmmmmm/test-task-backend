import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { StaffType } from '../enums/staff-type.enum.js';

/**
 * Staff member. A single table is used for all three staff types and the
 * `type` column acts as the business discriminator (deliberate single-table
 * design, no ORM inheritance).
 *
 * The hierarchy is represented by the self-referencing `supervisorId` foreign
 * key. Hierarchy invariants (cycles, self-supervision, Employees must not
 * supervise) are enforced in `StaffService`.
 */
@Entity('staff')
export class StaffEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** Calendar date `YYYY-MM-DD`. */
  @Column({ type: 'varchar', length: 10 })
  joinedAt: string;

  @Column({ type: 'simple-enum', enum: StaffType })
  type: StaffType;

  @Column({ type: 'real', nullable: true })
  baseSalaryOverride: number | null;

  /** Self-referencing supervisor foreign key (tree/forest). */
  @Column({ type: 'integer', nullable: true })
  supervisorId: number | null;
}