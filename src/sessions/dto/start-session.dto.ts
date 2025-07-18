import { IsString, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class StartSessionDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  topics: string[];
}
