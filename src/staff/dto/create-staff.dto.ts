import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateStaffDto {
  @ApiProperty({ example: 'Alice' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '2020-01-15', description: 'ISO calendar date YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'joinedAt must be a date in YYYY-MM-DD format',
  })
  joinedAt: string;

  @ApiProperty({ enum: StaffType })
  @IsEnum(StaffType)
  type: StaffType;

  @ApiPropertyOptional({ example: 1200, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalaryOverride?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  supervisorId?: number | null;
}