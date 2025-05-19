import { IsString, IsNumber, IsISO8601, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MetricsData, MetricsFilter } from '@forge-board/shared/api-interfaces';

export class CreateMetricsDto implements Partial<MetricsData> {
  @ApiProperty({ description: 'CPU usage percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  cpu: number;

  @ApiProperty({ description: 'Memory usage percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  memory: number;

  @ApiProperty({ description: 'Disk usage percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  disk: number;

  @ApiProperty({ description: 'Network usage percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  network: number;
}

export class MetricsFilterDto implements Partial<MetricsFilter> {
  @ApiProperty({ required: false })
  @IsISO8601()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsISO8601()
  @IsString()
  @IsOptional()
  endDate?: string;
  
  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minCpu?: number;
  
  @ApiProperty({ required: false })
  @IsNumber()
  @Max(100)
  @IsOptional()
  maxCpu?: number;
}
