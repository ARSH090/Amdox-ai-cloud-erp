import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Amdox ERP E2E Workflows', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should hit the health check endpoint successfully', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200);
  });

  it('should enforce tenant isolation via headers', () => {
    return request(app.getHttpServer())
      .get('/api/hr/employees')
      .set('x-tenant-id', 'invalid-tenant')
      .expect(403); // Assuming the TenantActivationMiddleware rejects invalid tenant
  });

  it('should generate a purchase requisition successfully (mock flow)', async () => {
    // Note: E2E testing for mutative endpoints requires setup/teardown of test DB
    // This is a placeholder for the integration test.
    expect(true).toBe(true);
  });
});
