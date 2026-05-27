// apps/api/src/modules/bi/bi.resolver.ts
import { Resolver, Query, Args } from '@nestjs/graphql';
import { BiService } from './bi.service';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class TransactionVelocity {
  @Field()
  hour: string;

  @Field(() => Int)
  tps: number;
}

@ObjectType()
export class AssetAllocation {
  @Field(() => Float)
  infrastructure: number;

  @Field(() => Float)
  aiLiquidity: number;

  @Field(() => Float)
  other: number;
}

@ObjectType()
export class BiAnalytics {
  @Field(() => [TransactionVelocity])
  transactionVelocity: TransactionVelocity[];

  @Field(() => AssetAllocation)
  assetAllocation: AssetAllocation;

  @Field(() => Int)
  systemScore: number;
}

@Resolver(() => BiAnalytics)
export class BiResolver {
  constructor(private readonly biService: BiService) {}

  @Query(() => BiAnalytics, { name: 'readIsolatedAnalytics' })
  async getReadIsolatedAnalytics(
    @Args('tenantId') tenantId: string,
  ): Promise<BiAnalytics> {
    return this.biService.getReadIsolatedAnalytics(tenantId);
  }
}
