import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { PrismaService } from '../../database/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PayslipGeneratorService {
  private readonly logger = new Logger(PayslipGeneratorService.name);
  private s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async generateAndUpload(tenantId: string, payslipId: string) {
    this.logger.log(`Generating payslip PDF for ${payslipId}`);

    return this.prisma.runInTenantContext(tenantId, async (tx) => {
      const payslip = await tx.payslip.findUnique({
        where: { id: payslipId },
        include: { employee: true, payrollRun: true }
      });

      if (!payslip) throw new Error('Payslip not found');

      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px;">
            <h1>Payslip: ${payslip.payrollRun.periodName}</h1>
            <h2>Employee: ${payslip.employee.fullName}</h2>
            <hr />
            <p><strong>Gross Pay:</strong> $${payslip.grossPay.toString()}</p>
            <p><strong>Net Pay:</strong> $${payslip.netPay.toString()}</p>
          </body>
        </html>
      `;

      const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(htmlContent);
      const pdfBuffer = await page.pdf({ format: 'A4' });
      await browser.close();

      const s3Key = `payslips/${tenantId}/${payslipId}.pdf`;
      const bucket = this.configService.get<string>('AWS_S3_BUCKET', 'amdox-erp-assets');

      await this.s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ServerSideEncryption: 'AES256'
      }));

      await tx.payslip.update({
        where: { id: payslipId },
        data: { pdfS3Key: s3Key, isEncrypted: true }
      });

      return s3Key;
    });
  }
}
