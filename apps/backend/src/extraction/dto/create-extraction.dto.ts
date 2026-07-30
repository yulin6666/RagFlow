import { IsString, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ExtractionFieldDto {
  @IsString()
  key: string;

  @IsString()
  label: string;
}

export class CreateExtractionDto {
  @IsString()
  documentId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExtractionFieldDto)
  fields: ExtractionFieldDto[];
}
