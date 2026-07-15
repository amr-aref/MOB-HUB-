import { useQueryClient } from '@tanstack/react-query';
import {
  useGetNotifications,
  useGetNotificationsUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  getGetNotificationsQueryKey,
  getGetNotificationsUnreadCountQueryKey,
} from '@workspace/api-client-react';
import type { NotificationDto } from '@workspace/api-client-react';

/**
 * Reusable notification data hook — every screen that needs the notification
 * list, an unread badge, or read/delete actions goes through this hook
 * instead of calling the generated React Query hooks directly. Keeps the
 * API/query-key details in one place per the app's Repository Pattern.
 *
 * @param userId Recipient key: buyer device UUID or seller storeId. Pass
 *               `undefined` while it's still loading — queries stay disabled.
 */
export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  const listQuery = useGetNotifications(
    { userId: userId ?? '' },
    { query: { enabled: !!userId } },
  );

  const unreadQuery = useGetNotificationsUnreadCount(
    { userId: userId ?? '' },
    { query: { enabled: !!userId, refetchInterval: 30_000 } },
  );

  const invalidate = () => {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey({ userId }) });
    queryClient.invalidateQueries({ queryKey: getGetNotificationsUnreadCountQueryKey({ userId }) });
  };

  const markReadMutation = useMarkNotificationRead({
    mutation: { onSuccess: invalidate },
  });

  const markAllReadMutation = useMarkAllNotificationsRead({
    mutation: { onSuccess: invalidate },
  });

  const deleteMutation = useDeleteNotification({
    mutation: { onSuccess: invalidate },
  });

  return {
    notifications: (listQuery.data ?? []) as NotificationDto[],
    unreadCount: unreadQuery.data?.unreadCount ?? 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: () => {
      listQuery.refetch();
      unreadQuery.refetch();
    },
    isRefetching: listQuery.isRefetching,
    markRead: (id: string) => markReadMutation.mutate({ id }),
    markAllRead: () => userId && markAllReadMutation.mutate({ data: { userId } }),
    remove: (id: string) => deleteMutation.mutate({ id }),
  };
}
