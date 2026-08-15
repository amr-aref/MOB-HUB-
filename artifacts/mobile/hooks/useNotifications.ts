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
 * @param userId Authenticated user id (req.user.sub). Pass undefined while
 *               auth is loading — queries stay disabled. Backend ignores
 *               client-supplied userId and uses the session instead.
 */
export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  const listQuery = useGetNotifications(
    { userId: userId ?? '' },
    { query: { queryKey: getGetNotificationsQueryKey({ userId: userId ?? '' }), enabled: !!userId } },
  );

  const unreadQuery = useGetNotificationsUnreadCount(
    { userId: userId ?? '' },
    { query: { queryKey: getGetNotificationsUnreadCountQueryKey({ userId: userId ?? '' }), enabled: !!userId, refetchInterval: 30_000 } },
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
    markRead: (id: string) =>
      userId && markReadMutation.mutate({ id, params: { userId } }),
    markAllRead: () =>
      userId && markAllReadMutation.mutate({ data: { userId } }),
    remove: (id: string) =>
      userId && deleteMutation.mutate({ id, params: { userId } }),
  };
}
