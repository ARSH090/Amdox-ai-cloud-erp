// apps/api/src/modules/supply-chain/supply-chain.module.ts
import { Module } from '@nestjs/common';
import { SupplyChainService } from './supply-chain.service';
import { SupplyChainController } from './supply-chain.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [SupplyChainController],
  providers: [SupplyChainService, PrismaService],
  exports: [SupplyChainService]
})
export class SupplyChainModule {}
