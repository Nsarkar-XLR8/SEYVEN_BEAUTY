import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NavigationService } from './services/navigation.service';

@ApiTags('Navigation')
@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get('mega-menu')
  @ApiOperation({
    summary: 'Retrieve luxury storefront Mega-Menu hierarchical tree (Categories, Concerns, Regimens, Textures, Actives)',
    description: 'Cached in Redis with sub-millisecond response latency. Automatically invalidated upon catalog mutations.',
  })
  @ApiResponse({ status: 200, description: 'Cached hierarchical Mega-Menu tree' })
  getMegaMenu() {
    return this.navigationService.getMegaMenu();
  }
}
