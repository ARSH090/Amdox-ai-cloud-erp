// apps/api/src/common/middleware/security-headers.middleware.ts
// OWASP-compliant security headers middleware using Helmet.js configuration patterns
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise Security Headers Middleware.
 * Applies OWASP Top-10 mitigations via strict Content-Security-Policy,
 * HTTP Strict Transport Security (HSTS), X-Content-Type-Options,
 * X-Frame-Options, and Referrer-Policy enforcement.
 *
 * Covers Checklist Items:
 * - 16.2: XSS Prevention via CSP nonce-based script policies
 * - 16.3: Clickjacking prevention (X-Frame-Options: DENY)
 * - 16.5: HSTS enforcement with 1-year max-age + includeSubDomains
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityHeadersMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate per-request CSP nonce for inline script allowlisting
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    (req as any).__cspNonce = nonce;

    // ── Content-Security-Policy ──────────────────────────────────────
    // Strict CSP blocking inline scripts, eval, and unauthorized origins
    const cspDirectives = [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `img-src 'self' data: blob: https:`,
      `font-src 'self' https://fonts.gstatic.com`,
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'} https://*.supabase.co wss://*.supabase.co`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `object-src 'none'`,
      `upgrade-insecure-requests`,
    ].join('; ');

    res.setHeader('Content-Security-Policy', cspDirectives);

    // ── HTTP Strict Transport Security ───────────────────────────────
    // 1-year max-age with includeSubDomains and preload directive
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // ── Anti-Clickjacking ────────────────────────────────────────────
    res.setHeader('X-Frame-Options', 'DENY');

    // ── MIME Sniffing Prevention ──────────────────────────────────────
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // ── Referrer Policy ──────────────────────────────────────────────
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // ── Permissions Policy ───────────────────────────────────────────
    // Disable browser features not required by the ERP platform
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
    );

    // ── Cross-Origin Policies ────────────────────────────────────────
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // ── Remove Server Fingerprint ────────────────────────────────────
    res.removeHeader('X-Powered-By');

    next();
  }
}
