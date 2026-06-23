import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, TenantStatus } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class TenantActivationMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const activationToken = req.headers['activation-token'] as string;

    if (!tenantId && !activationToken) {
      return next(); // Pass through if neither header is provided
    }

    const query: any = {};
    if (activationToken) {
      query.activationId = activationToken;
    } else if (tenantId) {
      query.id = tenantId;
    }

    const tenant = await prisma.tenant.findFirst({
      where: query,
    });

    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new ForbiddenException('Tenant account activation required or suspended');
    }

    // Attach tenant status to request for downstream usage if needed
    (req as any).tenantStatus = tenant.status;
    (req as any).tenantId = tenant.id;

    next();
  }
}
