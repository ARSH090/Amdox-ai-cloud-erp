// apps/web/hooks/useApiQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponseEnvelope } from '../services/apiClient';

export function useFetchLedgerAccounts(tenantId: string) {
  return useQuery<ApiResponseEnvelope<any[]>, Error>({
    queryKey: ['ledger', tenantId],
    queryFn: async () => {
      const response = await apiClient.get(`/finance/ledger`, {
        headers: { 'X-Tenant-Id': tenantId }
      });
      return response.data;
    },
    staleTime: 60000, // Caches data locally for 60s before refreshing backgrounds silently
    refetchOnWindowFocus: false,
  });
}

export function usePostJournalEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tenantId, payload }: { tenantId: string; payload: any }) => {
      const response = await apiClient.post(`/finance/journal-entries`, payload, {
        headers: { 'X-Tenant-Id': tenantId }
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Auto-invalidate stale data trees immediately on mutation success
      queryClient.invalidateQueries({ queryKey: ['ledger', variables.tenantId] });
    },
  });
}
