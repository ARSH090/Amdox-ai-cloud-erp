# Final Review Checklist (Enterprise Submission Gate)

## Functional Checks
- `[x]` Login works with tenant context present.
- `[x]` Requests without x-tenant-id are rejected.
- `[x]` Users cannot access another tenant’s data.
- `[x]` Finance ledger supports double-entry accounting.
- `[x]` Journal entries always balance debit = credit.
- `[ ]` AP flow works from invoice to payment.
- `[ ]` AR flow works from invoice to aging report.
- `[ ]` HR employee CRUD works.
- `[ ]` Leave request and approval flow works.
- `[ ]` Payroll run produces correct payslips.
- `[ ]` Supply chain requisition → PO → GRN works.
- `[ ]` Inventory updates after goods receipt.
- `[ ]` BI dashboard loads and filters data correctly.
- `[x]` Forecasting service returns prediction output.

## Security Checks
- `[ ]` SSO works with OIDC or SAML / MFA enforced (Mocked/Scoped).
- `[ ]` RBAC hides unauthorized modules/actions.
- `[ ]` Audit logs capture every mutating action.
- `[x]` Audit chain or tamper-evident logging works.
- `[ ]` Input validation blocks invalid payloads.

## Data & Performance Checks
- `[x]` Prisma schema includes required core entities.
- `[x]` Tenant filtering is applied universally.
- `[ ]` Finance period lock works correctly.
- `[ ]` Offline read views open without network.

## DevOps & Demo Readiness
- `[x]` Local dev setup starts cleanly.
- `[x]` Unit & Integration tests pass.
- `[x]` E2E tests pass.
- `[x]` Deployment manifests are valid.
- `[x]` Demo has a clear start, middle, and end.
- `[x]` README has setup, architecture, and screenshots.
- `[x]` Demo video/script is ready and polished.
