import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Company configuration. For this coding task a single company record is
 * sufficient (id always `1`).
 */
@Entity('company')
export class CompanyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'real' })
  defaultBaseSalary: number;
}