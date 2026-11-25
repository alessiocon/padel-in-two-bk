import { ApiProperty } from '@nestjs/swagger';

export class SearchResponseDto <T> {
    data: T[];
    @ApiProperty({ minimum: 0 })
    total: number;
    @ApiProperty({ minimum: 1, maximum: 50 })
    take: number;
    @ApiProperty({ minimum: 0 })
    skip: number;
    @ApiProperty({ minimum: 1 })
    page: number;
}