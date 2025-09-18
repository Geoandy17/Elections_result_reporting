/**
 * @file Application principale avec système de rôles intégré
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import RoleBasedApp from './components/RoleBasedApp';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true, // Refetch when window gains focus
      refetchOnReconnect: true, // Refetch when network reconnects
      staleTime: 10000, // Data is fresh for 10 seconds
      retry: 3, // Retry failed requests 3 times
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleBasedApp />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </QueryClientProvider>
  );
};

export default App;
