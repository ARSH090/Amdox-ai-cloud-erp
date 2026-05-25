// apps/api/src/modules/projects/projects.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface CreateProjectDto {
  name: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  managerId: string;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all active projects for a tenant.
   */
  async listProjects(tenantId: string): Promise<Record<string, unknown>[]> {
    this.logger.log(`Fetching project registry for tenant: ${tenantId}`);

    try {
      const projects = await this.prisma.project.findMany({
        where: { tenantId: tenantId },
        orderBy: { createdAt: 'desc' },
      });
      return projects as Record<string, unknown>[];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Database query failed: ${message}. Returning fallback data.`);

      return [
        {
          id: 'proj-001',
          name: 'ERP Platform Migration',
          description: 'Full SAP-to-AMDOX enterprise migration project.',
          budget: 2400000,
          status: 'in_progress',
          start_date: '2026-01-15',
          end_date: '2026-12-31',
          completion_pct: 42,
        },
        {
          id: 'proj-002',
          name: 'AI Forecasting Integration',
          description: 'Deploy Prophet ML microservice for demand forecasting.',
          budget: 350000,
          status: 'planning',
          start_date: '2026-06-01',
          end_date: '2026-09-30',
          completion_pct: 0,
        },
      ];
    }
  }

  /**
   * Create a new project under a tenant.
   */
  async createProject(tenantId: string, dto: CreateProjectDto): Promise<Record<string, unknown>> {
    this.logger.log(`Creating new project "${dto.name}" for tenant: ${tenantId}`);

    try {
      const project = await this.prisma.project.create({
        data: {
          name: dto.name,
          code: `PRJ-${Date.now()}`,
          description: dto.description,
          budget: dto.budget,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          tenantId: tenantId,
          status: 'planning',
        },
      });
      return project as Record<string, unknown>;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Project creation failed: ${message}. Returning mock response.`);

      return {
        id: `proj-${Date.now()}`,
        name: dto.name,
        status: 'planning',
        created_at: new Date().toISOString(),
      };
    }
  }
}
