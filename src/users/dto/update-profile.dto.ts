import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ArrayUnique,
} from 'class-validator';

export class UpdateProfileDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  weakSubjects: string[];

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  strongSubjects: string[];

  @IsNumber()
  accuracy: number;

  @IsNumber()
  xp: number;

  @IsNumber()
  @IsOptional()
  studyHabitScore?: number;
}
