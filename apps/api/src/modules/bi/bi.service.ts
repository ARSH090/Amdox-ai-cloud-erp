// apps/api/src/modules/bi/bi.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BiService {
  private readonly logger = new Logger(BiService.name);

  /**
   * Fetch asset allocations and ledger stats using read-replica views
   * isolating intensive queries from write-heavy transactional operations.
   */
  async getReadIsolatedAnalytics(tenantId: string): Promise<any> {
    this.logger.log(`Querying read-isolated analytics replica for tenant ID: ${tenantId}`);
    
    // Simulate read model querying
    return {
      transactionVelocity: [
        { hour: '08:00', tps: 840 },
        { hour: '09:00', tps: 920 },
        { hour: '10:00', tps: 1040 },
        { hour: '11:00', tps: 980 }
      ],
      assetAllocation: {
        infrastructure: 62.00,
        aiLiquidity: 28.00,
        other: 10.00
      },
      systemScore: 84
    };
  }

  /**
   * Stream high-volume Excel extractions directly to output without query locks
   */
  async streamBigExcelExtraction(tenantId: string, writeStream: any): Promise<void> {
    this.logger.log(`Streaming CSV data from isolated read database for tenant: ${tenantId}`);
    
    // Write headers
    writeStream.write("RowNumber,Timestamp,SourceNode,Message\n");
    
    // Stream 1000 simulated log lines in small memory chunks
    for (let i = 1; i <= 1000; i++) {
      const line = `${i},${new Date().toISOString()},US-EAST-01,SYS_STAT log code verification index ${i}\n`;
      writeStream.write(line);
      
      if (i % 250 === 0) {
        // yield to thread
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    }
    
    writeStream.end();
  }
}
