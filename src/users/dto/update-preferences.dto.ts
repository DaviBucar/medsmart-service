import { IsString, IsNumber } from 'class-validator';

export class UpdatePreferencesDto {
  @IsString()
  preferredStudyMethod: string;

  @IsNumber()
  dailyGoal: number;

  @IsString()
  preferredTimeOfDay: string;
}
