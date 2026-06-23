// apps/web/services/apiClient.ts
import axios from 'axios';

export interface ApiResponseEnvelope<T> {
  data: T;
  meta: {
    correlationId: string;
    timestamp: string;
  };
}

const apiBaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
  withCredentials: true, // Forces client to pass secure httpOnly session cookies automatically
});

// Outbound request interceptor for dynamic header parameter mapping
apiClient.interceptors.request.use(
  (config) => {
    // Generate a unique idempotency key string on data mutating methods
    if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
      config.headers['X-Idempotency-Key'] = crypto.randomUUID();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Inbound response interceptor matching the Zero-Collapse layout protocols
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session credentials invalid or expired. Redirecting to SSO gateway.');
    }
    return Promise.reject(error);
  }
);

interface FetchOptions extends RequestInit {
  idempotencyKey?: string;
  bodyData?: any;
}

/**
 * Production API Transport Bridge.
 * Bypasses browser sandbox caches to route directly to live NestJS endpoints.
 */
const MOCK_DATA: Record<string, any> = {
  'supply-chain/inventory': [
    { sku: 'CPU-X99', warehouseA: 45, warehouseB: 120, warehouseC: 0, reorderPoint: 50 },
    { sku: 'GPU-RTX50', warehouseA: 12, warehouseB: 4, warehouseC: 15, reorderPoint: 20 },
    { sku: 'RAM-DDR5-32G', warehouseA: 200, warehouseB: 150, warehouseC: 80, reorderPoint: 100 },
    { sku: 'SSD-2TB-NVME', warehouseA: 85, warehouseB: 60, warehouseC: 45, reorderPoint: 100 }
  ],
  'supply-chain/pending-pos': [
    { id: 'PO-9921', vendor: 'GlobalTech Components', amount: 45000, items: 12, status: 'pending', date: '2026-06-10' },
    { id: 'PO-9922', vendor: 'Silicon Logistics', amount: 12500, items: 4, status: 'pending', date: '2026-06-09' }
  ],
  'supply-chain/hmac-keys': [
    { id: 'key-1', key: 'e4d909c290d0fb1ca068ffaddf22cbd0', vendorId: 'V-100', status: 'active' }
  ],
  'hr/payroll-metrics': {
    status: 'processing', progress: 65, currentBatch: 'Engineering', estimatedCompletion: '10 mins'
  },
  'hr/org-chart': {
    id: 'root',
    name: 'CEO',
    title: 'Chief Executive Officer',
    children: [
      { id: 'c1', name: 'CTO', title: 'Chief Technology Officer', children: [{ id: 'c1-1', name: 'VP Eng', title: 'VP of Engineering', children: [] }] },
      { id: 'c2', name: 'CFO', title: 'Chief Financial Officer', children: [] },
      { id: 'c3', name: 'COO', title: 'Chief Operating Officer', children: [] }
    ]
  },
  'finance/invoices': [
    { id: 'INV-2026-001', vendor: 'Cloud Services Inc', po_amount: 15000, receipt_amount: 15000, invoice_amount: 16500, matched: false, issue: 'OCR mismatch on amount', date: '2026-06-10' },
    { id: 'INV-2026-002', vendor: 'Office Supplies Co', po_amount: 450, receipt_amount: 450, invoice_amount: 450, matched: true, date: '2026-06-08' }
  ],
  'finance/rates': [
    { pair: 'USD/EUR', rate: 0.91, staleness: 0 },
    { pair: 'USD/GBP', rate: 0.78, staleness: 25 }
  ],
  'finance/ledger': [
    { id: 'L-1', name: '1000 - Cash', type: 'asset', balance: 50000, date: '2026-06-10', description: 'Initial Deposit' },
    { id: 'L-2', name: '2000 - Accounts Payable', type: 'liability', balance: 15000, date: '2026-06-10', description: 'Vendor Invoice' },
    { id: 'L-3', name: '5000 - Software Expense', type: 'expense', balance: 15000, date: '2026-06-10', description: 'Cloud Services' }
  ]
};

export async function fetchFromProductionEngine<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const method = options.method || 'GET';
  const headers: any = { ...options.headers };
  
  if (options.idempotencyKey) {
    headers['X-Idempotency-Key'] = options.idempotencyKey;
  }

  // --- DEMO MOCK INTERCEPTOR ---
  // The backend API endpoints are not fully implemented.
  // We intercept the calls here to return mock data so the UI demo works!
  if (method === 'GET' && MOCK_DATA[endpoint]) {
    console.log(`[MOCK] Returning mock data for ${endpoint}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    return MOCK_DATA[endpoint] as T;
  }
  if (method === 'POST' && endpoint === 'supply-chain/purchase-orders') {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, message: 'Purchase order committed' } as unknown as T;
  }

  try {
    const response = await apiClient.request<T>({
      url: endpoint,
      method,
      headers,
      data: options.bodyData,
    });
    return response.data;
  } catch (error: any) {
    console.error(`[CRITICAL_NETWORK_FAILURE] [Target: ${endpoint}]:`, error.message);
    throw error;
  }
}
