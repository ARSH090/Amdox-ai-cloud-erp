import { Test, TestingModule } from '@nestjs/testing';
import { ForecastingService } from './forecasting.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';

describe('ForecastingService', () => {
  let service: ForecastingService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForecastingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:8000'),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ForecastingService>(ForecastingService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSkuForecast', () => {
    it('should return FastAPI prediction data on success', async () => {
      const mockResponse = {
        data: [
          { date: '2026-07-01', predictedDemand: 15.5, confidenceLow: 12.0, confidenceHigh: 18.0 }
        ]
      };
      
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as any));

      const result = await service.getSkuForecast('tenant-1', 'SKU-001', 30, []);
      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith('http://localhost:8000/predict/tenant-1/SKU-001?days=30');
    });

    it('should return gracefully degraded fallback data if FastAPI is down', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('Connection refused')));

      const mockHistoricalData = [{ date: '2026-06-01', quantity: 10 }];
      const result = await service.getSkuForecast('tenant-1', 'SKU-001', 1, mockHistoricalData);
      
      expect(result.model_version).toEqual('fallback-moving-average-v1.0');
      expect(result.predictions).toBeDefined();
      expect(result.predictions[0].predicted_quantity).toBeCloseTo(10.5); // 10 * 1.05
    });
  });
});
