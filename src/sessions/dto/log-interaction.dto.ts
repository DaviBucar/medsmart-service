import { IsString, IsBoolean, IsInt, Min } from 'class-validator';

export class LogInteractionDto {
  @IsString()
  questionId: string;

  @IsBoolean()
  correct: boolean;

  @IsString()
  selectedOption: string;

  @IsInt()
  @Min(0)
  timeSpent: number; // em segundos
}
