// apps/api/src/modules/projects/projects.controller.ts
import { Controller, Get, Post, Body, Headers, Logger } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * GET /projects
   * List all active projects for the current tenant.
   */
  @Get()
  async listProjects(
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.projectsService.listProjects(tenantId || 'amdox-engineering');
  }

  /**
   * POST /projects
   * Create a new project under the current tenant.
   */
  @Post()
  async createProject(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { name: string; description: string; budget: number; startDate: string; endDate: string; managerId: string },
  ): Promise<Record<string, unknown>> {
    return this.projectsService.createProject(tenantId || 'amdox-engineering', body);
  }
}
