import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DagValidatorService {
  constructor(private prisma: PrismaService) {}

  async validateNoCycles(tenantId: string, projectId: string): Promise<boolean> {
    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      const tasks = await tx.task.findMany({ where: { projectId } });
      const dependencies = await tx.taskDependency.findMany({
        where: { task: { projectId } }
      });

      // Kahn's algorithm for Topological Sorting
      const adjList = new Map<string, string[]>();
      const inDegree = new Map<string, number>();

      for (const t of tasks) {
        adjList.set(t.id, []);
        inDegree.set(t.id, 0);
      }

      for (const dep of dependencies) {
        adjList.get(dep.dependsOnTaskId)?.push(dep.taskId);
        inDegree.set(dep.taskId, (inDegree.get(dep.taskId) || 0) + 1);
      }

      const queue: string[] = [];
      for (const [node, degree] of inDegree.entries()) {
        if (degree === 0) queue.push(node);
      }

      let visitedCount = 0;
      while (queue.length > 0) {
        const u = queue.shift()!;
        visitedCount++;

        const neighbors = adjList.get(u) || [];
        for (const v of neighbors) {
          inDegree.set(v, inDegree.get(v)! - 1);
          if (inDegree.get(v) === 0) queue.push(v);
        }
      }

      if (visitedCount !== tasks.length) {
        throw new ConflictException('Cyclic dependency detected in project tasks');
      }

      return true;
    });
  }
}
