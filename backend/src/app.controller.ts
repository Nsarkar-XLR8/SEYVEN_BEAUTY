import { Controller, Get, Head, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @Head()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Root service probe and status endpoint' })
  @ApiResponse({ status: 200, description: 'Service is operational' })
  getRoot() {
    return {
      status: 'operational',
      service: 'SEYVEN Backend Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      docs: '/docs',
    };
  }
}
