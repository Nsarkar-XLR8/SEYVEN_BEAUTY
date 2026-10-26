import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Kubernetes/load balancer liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive and running' })
  checkLiveness() {
    return this.health.check([
      () => ({
        process: {
          status: 'up',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Kubernetes/load balancer readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept incoming traffic' })
  checkReadiness() {
    return this.health.check([
      () => ({
        system: {
          status: 'up',
          memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          nodeVersion: process.version,
        },
      }),
    ]);
  }
}

