import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsUUID()
  @IsOptional()
  documentId?: string;

  @IsUUID()
  @IsOptional()
  sessionId?: string;
}
