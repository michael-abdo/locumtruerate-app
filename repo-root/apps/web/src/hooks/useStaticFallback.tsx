/**
 * Hook to provide static fallback data when tRPC calls fail in static export mode
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isStaticMode, staticMockApi } from '@/lib/static-mock-data'
import { trpc } from '@/providers/trpc-provider'

export function useJobsWithFallback() {
  const queryClient = useQueryClient()
  
  const trpcQuery = trpc.jobs.list.useQuery(undefined, {
    enabled: !isStaticMode(),
    retry: false
  })

  const staticQuery = useQuery({
    queryKey: ['jobs', 'static'],
    queryFn: staticMockApi.jobs.list,
    enabled: isStaticMode() || trpcQuery.isError,
    staleTime: Infinity
  })

  if (isStaticMode() || trpcQuery.isError) {
    return {
      data: staticQuery.data,
      isLoading: staticQuery.isLoading,
      error: staticQuery.error,
      isError: staticQuery.isError
    }
  }

  return trpcQuery
}

export function useJobByIdWithFallback(id: string) {
  const trpcQuery = trpc.jobs.getById.useQuery({ id }, {
    enabled: !isStaticMode() && !!id,
    retry: false
  })

  const staticQuery = useQuery({
    queryKey: ['job', id, 'static'],
    queryFn: () => staticMockApi.jobs.getById(id),
    enabled: (isStaticMode() || trpcQuery.isError) && !!id,
    staleTime: Infinity
  })

  if (isStaticMode() || trpcQuery.isError) {
    return {
      data: staticQuery.data,
      isLoading: staticQuery.isLoading,
      error: staticQuery.error,
      isError: staticQuery.isError
    }
  }

  return trpcQuery
}

export function useJobSearchWithFallback(query: string) {
  const trpcQuery = trpc.jobs.search.useQuery({ query }, {
    enabled: !isStaticMode() && !!query,
    retry: false
  })

  const staticQuery = useQuery({
    queryKey: ['jobs', 'search', query, 'static'],
    queryFn: () => staticMockApi.jobs.search(query),
    enabled: (isStaticMode() || trpcQuery.isError) && !!query,
    staleTime: Infinity
  })

  if (isStaticMode() || trpcQuery.isError) {
    return {
      data: staticQuery.data,
      isLoading: staticQuery.isLoading,
      error: staticQuery.error,
      isError: staticQuery.isError
    }
  }

  return trpcQuery
}

export function useCurrentUserWithFallback() {
  const trpcQuery = trpc.users.getCurrentUser.useQuery(undefined, {
    enabled: !isStaticMode(),
    retry: false
  })

  const staticQuery = useQuery({
    queryKey: ['user', 'current', 'static'],
    queryFn: staticMockApi.users.getCurrentUser,
    enabled: isStaticMode() || trpcQuery.isError,
    staleTime: Infinity
  })

  if (isStaticMode() || trpcQuery.isError) {
    return {
      data: staticQuery.data,
      isLoading: staticQuery.isLoading,
      error: staticQuery.error,
      isError: staticQuery.isError
    }
  }

  return trpcQuery
}

export function useAnalyticsWithFallback() {
  const trpcQuery = trpc.analytics.getDashboard.useQuery(undefined, {
    enabled: !isStaticMode(),
    retry: false
  })

  const staticQuery = useQuery({
    queryKey: ['analytics', 'dashboard', 'static'],
    queryFn: staticMockApi.analytics.getDashboard,
    enabled: isStaticMode() || trpcQuery.isError,
    staleTime: Infinity
  })

  if (isStaticMode() || trpcQuery.isError) {
    return {
      data: staticQuery.data,
      isLoading: staticQuery.isLoading,
      error: staticQuery.error,
      isError: staticQuery.isError
    }
  }

  return trpcQuery
}

export function useCalculationWithFallback() {
  const trpcMutation = trpc.calculations.calculate.useMutation()

  return {
    mutate: async (input: any) => {
      if (isStaticMode()) {
        return staticMockApi.calculations.calculate(input)
      }
      try {
        return await trpcMutation.mutateAsync(input)
      } catch (error) {
        // Fallback to mock data on error
        return staticMockApi.calculations.calculate(input)
      }
    },
    isLoading: trpcMutation.isLoading,
    error: trpcMutation.error,
    isError: trpcMutation.isError
  }
}

export function useLeadSubmissionWithFallback() {
  const trpcMutation = trpc.leads.create.useMutation()

  return {
    mutate: async (input: any) => {
      if (isStaticMode()) {
        return staticMockApi.leads.create(input)
      }
      try {
        return await trpcMutation.mutateAsync(input)
      } catch (error) {
        // Fallback to mock data on error
        return staticMockApi.leads.create(input)
      }
    },
    isLoading: trpcMutation.isLoading,
    error: trpcMutation.error,
    isError: trpcMutation.isError
  }
}