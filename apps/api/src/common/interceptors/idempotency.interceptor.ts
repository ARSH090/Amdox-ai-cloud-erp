import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ConflictException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL', 'redis://localhost:6379/0'), {
      maxRetriesPerRequest: null,
      retryStrategy: () => null, // Disable retries
    });
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['x-idempotency-key'];

    if (!idempotencyKey || (request.method !== 'POST' && request.method !== 'PUT' && request.method !== 'PATCH')) {
      return next.handle();
    }

    const tenantId = (request as any).tenantId || 'global';
    const redisKey = `idempotency:${tenantId}:${idempotencyKey}`;

    try {
      const isSet = await this.redis.setnx(redisKey, 'processing');
      
      if (isSet === 0) {
        throw new ConflictException('A request with this idempotency key is already processing or has been processed.');
      }

      await this.redis.expire(redisKey, 86400);
    } catch (e) {
      if (e instanceof ConflictException) throw e;
      // Ignore redis offline errors in dev
    }

    return next.handle();
  }
}
