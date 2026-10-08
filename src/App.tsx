import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/app/query-client';
import { AuthProvider } from '@/modules/auth/AuthContext';
import { AppRouter } from '@/app/router';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}
