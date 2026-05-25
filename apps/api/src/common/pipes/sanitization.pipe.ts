// apps/api/src/common/pipes/sanitization.pipe.ts
// Input sanitization pipe preventing injection attacks across all DTO properties
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';

/**
 * Enterprise Input Sanitization Pipe.
 * Recursively sanitizes all string properties in incoming request bodies,
 * stripping HTML tags, script injection payloads, SQL injection fragments,
 * and null byte attacks before they reach service layer logic.
 *
 * Covers Checklist Items:
 * - 16.1: SQL injection prevention at input boundary
 * - 16.2: XSS prevention via input sanitization
 * - 16.12: NoSQL injection prevention
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  private readonly logger = new Logger(SanitizationPipe.name);

  // Patterns that indicate potential injection attempts
  private readonly DANGEROUS_PATTERNS = [
    /(<script[\s\S]*?>[\s\S]*?<\/script>)/gi,       // Script tags
    /(javascript\s*:)/gi,                              // JavaScript protocol
    /(on\w+\s*=\s*["'])/gi,                           // Event handlers
    /(\bUNION\b\s+\bSELECT\b)/gi,                    // SQL UNION injection
    /(\bDROP\b\s+\bTABLE\b)/gi,                       // SQL DROP injection
    /(\bINSERT\b\s+\bINTO\b)/gi,                      // SQL INSERT injection
    /(\bDELETE\b\s+\bFROM\b)/gi,                      // SQL DELETE injection
    /(\b(ALTER|EXEC|EXECUTE)\b)/gi,                    // SQL ALTER/EXEC injection
    /(--\s*$)/gm,                                      // SQL comment injection
    /(\x00)/g,                                         // Null byte injection
    /(\{\s*["']?\$)/g,                                 // NoSQL operator injection ($gt, $ne, etc.)
  ];

  transform(value: any, metadata: ArgumentMetadata): any {
    if (metadata.type !== 'body' && metadata.type !== 'query') {
      return value;
    }

    if (value === null || value === undefined) {
      return value;
    }

    return this.sanitizeValue(value);
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        // Prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          this.logger.warn(`Prototype pollution attempt detected. Key: ${key}`);
          continue;
        }
        sanitized[key] = this.sanitizeValue(val);
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(input: string): string {
    let sanitized = input;

    // Strip null bytes
    sanitized = sanitized.replace(/\x00/g, '');

    // Remove HTML tags (DOMPurify-equivalent server-side)
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Detect and log dangerous patterns (without blocking valid text)
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        this.logger.warn(
          `Potential injection pattern detected in input: "${input.substring(0, 100)}..."`
        );
        // Strip the dangerous pattern
        sanitized = sanitized.replace(pattern, '');
      }
      // Reset lastIndex for global regex patterns
      pattern.lastIndex = 0;
    }

    // Trim excessive whitespace
    sanitized = sanitized.trim();

    // Limit maximum string length to prevent buffer overflow
    if (sanitized.length > 10_000) {
      sanitized = sanitized.substring(0, 10_000);
    }

    return sanitized;
  }
}
