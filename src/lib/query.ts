import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 30s — avoids refetch-on-every-focus thrash, but
      // background tabs still revalidate on the first re-focus after stale.
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error: any) => {
        // Don't retry 4xx: auth/permission issues won't self-heal.
        const status = error?.status ?? error?.statusCode;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// Query key factories — colocating them keeps invalidation predictable.
export const keys = {
  events: {
    all: ['events'] as const,
    list: () => [...keys.events.all, 'list'] as const,
    detail: (id: string) => [...keys.events.all, 'detail', id] as const,
    stats: () => [...keys.events.all, 'stats'] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    list: () => [...keys.contacts.all, 'list'] as const,
    byEvent: (eventId: string) => [...keys.contacts.all, 'byEvent', eventId] as const,
    detail: (id: string) => [...keys.contacts.all, 'detail', id] as const,
  },
  interactions: {
    all: ['interactions'] as const,
    byContact: (contactId: string) => [...keys.interactions.all, 'byContact', contactId] as const,
  },
  templates: {
    all: ['templates'] as const,
    list: () => [...keys.templates.all, 'list'] as const,
  },
};
