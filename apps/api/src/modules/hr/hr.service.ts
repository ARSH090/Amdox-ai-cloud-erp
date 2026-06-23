import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HrService {
  private readonly logger = new Logger(HrService.name);

  constructor(private prisma: PrismaService) {}

  async getOrgChart(tenantId: string, departmentId: string) {
    this.logger.log(`Fetching org chart for department ${departmentId} in tenant ${tenantId}`);
    
    // Recursive CTE to fetch hierarchical employee structures
    const orgChart = await this.prisma.$queryRaw`
      WITH RECURSIVE OrgChart AS (
        SELECT 
          id, 
          "employeeNumber", 
          "fullName", 
          "jobTitle", 
          "managerId", 
          "departmentId",
          1 as level
        FROM "Employee"
        WHERE "departmentId" = ${departmentId}::uuid AND "managerId" IS NULL AND "tenantId" = ${tenantId}::uuid
        
        UNION ALL
        
        SELECT 
          e.id, 
          e."employeeNumber", 
          e."fullName", 
          e."jobTitle", 
          e."managerId", 
          e."departmentId",
          o.level + 1
        FROM "Employee" e
        INNER JOIN OrgChart o ON e."managerId" = o.id
        WHERE e."tenantId" = ${tenantId}::uuid
      )
      SELECT * FROM OrgChart ORDER BY level, "fullName";
    `;

    return orgChart;
  }

  async getEmployees() {
    return this.prisma.employee.findMany({
      where: { isActive: true },
    });
  }

  async createEmployee(data: any) {
    return this.prisma.employee.create({
      data,
    });
  }

  async getLeaveRequests(employeeId?: string) {
    const where = employeeId ? { employeeId } : {};
    return this.prisma.leaveRequest.findMany({
      where,
    });
  }

  async createLeaveRequest(data: any) {
    return this.prisma.leaveRequest.create({
      data,
    });
  }
}
