import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvoiceOcrService {
  private readonly logger = new Logger(InvoiceOcrService.name);
  private textractClient: TextractClient;

  constructor(private configService: ConfigService) {
    this.textractClient = new TextractClient({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async processInvoice(pdfBuffer: Buffer): Promise<{ total: string; tax: string; raw: any }> {
    try {
      const command = new DetectDocumentTextCommand({
        Document: {
          Bytes: pdfBuffer,
        },
      });

      const response = await this.textractClient.send(command);
      
      let total = '0.00';
      let tax = '0.00';

      // Parse layout geometry to identify 'TOTAL' and 'TAX' (Simplified parsing)
      if (response.Blocks) {
        response.Blocks.forEach((block, index) => {
          if (block.BlockType === 'LINE' && block.Text) {
            const text = block.Text.toUpperCase();
            if (text.includes('TOTAL')) {
              // Try to find the next block that looks like a currency amount
              const nextBlock = response.Blocks![index + 1];
              if (nextBlock && nextBlock.Text && /^\$?\d+(\.\d{2})?$/.test(nextBlock.Text)) {
                total = nextBlock.Text.replace('$', '');
              }
            }
            if (text.includes('TAX')) {
              const nextBlock = response.Blocks![index + 1];
              if (nextBlock && nextBlock.Text && /^\$?\d+(\.\d{2})?$/.test(nextBlock.Text)) {
                tax = nextBlock.Text.replace('$', '');
              }
            }
          }
        });
      }

      return { total, tax, raw: response };
    } catch (error) {
      this.logger.error('Failed to process invoice via AWS Textract', error);
      throw new HttpException('OCR Processing failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
