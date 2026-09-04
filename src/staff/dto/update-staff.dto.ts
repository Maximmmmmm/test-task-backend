import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { StaffType } from '../enums/staff-type.enum.js';

export class UpdateStaffDto {
  @ApiPropertyOptional({ example: 'Alice' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '2020-01-15' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'joinedAt must be a date in YYYY-MM-DD format',
  })
  joinedAt?: string;

  @ApiPropertyOptional({ enum: StaffType })
  @IsOptional()
  @IsEnum(StaffType)
  type?: StaffType;

  /** `null` clears the override back to the company default. */
  @ApiPropertyOptional({ example: 1200, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalaryOverride?: number | null;

  /** `null` removes the supervisor. */
  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  supervisorId?: number | null;
}