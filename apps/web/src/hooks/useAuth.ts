import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR('/api/auth/session', fetcher);

  const login = async (email: string, password?: string, tenantId?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, tenantId }),
    });
    const result = await res.json();
    if (result.success) {
      mutate();
    }
    return result;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    mutate();
  };

  return {
    user: data?.session?.userId ? data.session : null,
    isLoading,
    error,
    login,
    logout,
  };
}
