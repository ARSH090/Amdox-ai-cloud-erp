// apps/api/src/modules/bi/bi.module.ts
import { Module } from '@nestjs/common';
import { BiService } from './bi.service';
import { BiController } from './bi.controller';
import { BiResolver } from './bi.resolver';

@Module({
  controllers: [BiController],
  providers: [BiService, BiResolver],
  exports: [BiService, BiResolver],
})
export class BiModule {}
