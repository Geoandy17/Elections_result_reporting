import React from 'react'
import ReactDOM from 'react-dom/client'
import RoleBasedApp from './components/RoleBasedApp.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './contexts/AuthContext'

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
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleBasedApp />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
