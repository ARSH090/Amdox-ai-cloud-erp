# Amdox ERP: Reviewer Demo Script

This script is designed for a quick, 5-minute reviewer walkthrough to demonstrate the core value, security, and integration capabilities of the Amdox Cloud ERP platform.

## 0:00 - 1:00: Platform Entry & Security (SuperAdmin)
1. **Navigate to `index.html`**: Present the premium marketing landing page. Highlight the dynamic tickers and offline PWA capability.
2. **Login as SuperAdmin**: Access the system.
3. **Show Tenant Activation Block**: Demonstrate how attempting to hit the API without the `x-tenant-id` header results in a 403 Forbidden. Explain that the `PrismaClient` extension strictly enforces Postgres Row-Level Security (RLS) dynamically under the hood.

## 1:00 - 2:30: Supply Chain & AI Forecasting (Supply Chain Operator)
1. **Switch Role to Supply Chain Operator**:
2. **Open Supply Chain Dashboard**: Point out the ECharts visualization rendering a 30-day Prophet forecast.
3. **Run "Happy Path" Procurement Flow**:
   - Create a new **Purchase Requisition** for a Server Rack.
   - Show how the API converts it into a **Purchase Order** (`generatePurchaseOrder` logic).
   - Simulate a **Goods Receipt**, showing that Inventory Totals automatically increment.

## 2:30 - 4:00: Finance & Ledger Integrity (Finance Manager)
1. **Switch Role to Finance Manager**:
2. **Open Accounts Payable (AP) Table**: Show the outstanding invoice generated from the Supply Chain procurement flow.
3. **Attempt Fraudulent Journal Entry**:
   - Manually intercept the API request payload to create an unbalanced journal entry (Debits: $100, Credits: $90).
   - Show the system rejecting it with `UnbalancedLedgerException`, proving Double-Entry structural integrity.
4. **Approve Payment**: Finalize the AP transaction.

## 4:00 - 5:00: Cryptographic Audit Validation (Compliance Officer)
1. **Switch Role to Compliance Officer**:
2. **Open Audit Logs**: Show the list of actions performed in the last 4 minutes (Login, Requisition, PO, Receipt, Payment).
3. **Demonstrate Tamper Evidence**:
   - Explain the background SHA-256 hash chains.
   - Mention that if an attacker were to manually bypass the API and modify the database directly to alter an invoice value, the `verifyChainIntegrity` service would flag a cryptographic mismatch instantly because the `prevHash` sequence would be broken.

---
**End of Demo.** Reviewer should now understand the multi-tenant isolation, cross-module data flow, AI-driven foresight, and zero-trust audit compliance of the system.
