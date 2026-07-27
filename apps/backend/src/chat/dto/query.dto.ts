import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsUUID()
  @IsNotEmpty()
  documentId: string;
}
