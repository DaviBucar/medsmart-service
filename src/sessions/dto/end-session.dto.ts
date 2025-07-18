import { IsInt, Min, IsString } from 'class-validator';

export class EndSessionDto {
  @IsInt()
  @Min(0)
  score: number;

  @IsInt()
  @Min(0)
  mistakes: number;

  @IsString()
  aiSummary: string;
}
