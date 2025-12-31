import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner@2.0.3';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from '@/app/context/session-context';
import type { Notification, NotificationGateway } from '@/app/gateways/NotificationGateway';
import { Inject, TkNotificationGateway } from '@/infra/container';

type NotificationTab = 'unread' | 'read';

function formatTimestamp(value: string) {
  const date = new Date(value);
  const dateLabel = date
    .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    .replace(/\//g, '.');
  const timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dateLabel} • ${timeLabel}`;
}

function sortByCreatedAt(items: Notification[]) {
  return items.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function NotificationBell() {
  const notificationGateway = Inject<NotificationGateway>(TkNotificationGateway);
  const { state } = useSession();
  const playerId = state.playerId;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<NotificationTab>('unread');

  const unreadKey = useMemo(() => ['notifications', 'unread', playerId], [playerId]);
  const readKey = useMemo(() => ['notifications', 'read', playerId], [playerId]);
  const countKey = useMemo(() => ['notifications', 'unread-count', playerId], [playerId]);

  const unreadCountQuery = useQuery({
    queryKey: countKey,
    queryFn: () => notificationGateway.countUnread({ playerId: playerId as string }),
    enabled: Boolean(playerId),
  });

  const {
    data: unreadNotifications = [],
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: unreadKey,
    queryFn: () => notificationGateway.listNotifications({ playerId: playerId as string, read: false }),
    enabled: open && Boolean(playerId),
  });

  const {
    data: readNotifications = [],
    isLoading: readLoading,
    refetch: refetchRead,
  } = useQuery({
    queryKey: readKey,
    queryFn: () => notificationGateway.listNotifications({ playerId: playerId as string, read: true }),
    enabled: open && Boolean(playerId),
  });

  useEffect(() => {
    if (!open || !playerId) return;
    void unreadCountQuery.refetch();
    void refetchUnread();
    void refetchRead();
  }, [open, playerId, refetchRead, refetchUnread, unreadCountQuery]);

  useEffect(() => {
    if (open) {
      setTab('unread');
    }
  }, [open]);

  const unreadCount = unreadCountQuery.data ?? 0;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!playerId) return;
      await notificationGateway.markAsRead({ playerId, notificationId });
    },
    onMutate: async (notificationId) => {
      if (!playerId) return;
      await queryClient.cancelQueries({ queryKey: unreadKey });
      await queryClient.cancelQueries({ queryKey: readKey });

      const previousUnread = queryClient.getQueryData<Notification[]>(unreadKey) ?? [];
      const previousRead = queryClient.getQueryData<Notification[]>(readKey) ?? [];
      const previousCount = queryClient.getQueryData<number>(countKey);

      const target = previousUnread.find((notification) => notification.id === notificationId);
      if (!target) {
        return { previousUnread, previousRead, previousCount };
      }

      const updated = { ...target, readAt: new Date().toISOString() };
      const nextUnread = previousUnread.filter((notification) => notification.id !== notificationId);
      const nextRead = sortByCreatedAt([updated, ...previousRead]);
      const baseCount = typeof previousCount === 'number' ? previousCount : previousUnread.length;

      queryClient.setQueryData(unreadKey, nextUnread);
      queryClient.setQueryData(readKey, nextRead);
      queryClient.setQueryData(countKey, Math.max(0, baseCount - 1));

      return { previousUnread, previousRead, previousCount };
    },
    onError: (error, _notificationId, context) => {
      if (context?.previousUnread) {
        queryClient.setQueryData(unreadKey, context.previousUnread);
      }
      if (context?.previousRead) {
        queryClient.setQueryData(readKey, context.previousRead);
      }
      if (typeof context?.previousCount === 'number') {
        queryClient.setQueryData(countKey, context.previousCount);
      }
      toast.error((error as Error)?.message || 'Falha ao marcar notificação como lida.');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: unreadKey });
      await queryClient.invalidateQueries({ queryKey: readKey });
      await queryClient.invalidateQueries({ queryKey: countKey });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!playerId) return;
      await notificationGateway.markAllAsRead({ playerId });
    },
    onMutate: async () => {
      if (!playerId) return;
      await queryClient.cancelQueries({ queryKey: unreadKey });
      await queryClient.cancelQueries({ queryKey: readKey });

      const previousUnread = queryClient.getQueryData<Notification[]>(unreadKey) ?? [];
      const previousRead = queryClient.getQueryData<Notification[]>(readKey) ?? [];
      const previousCount = queryClient.getQueryData<number>(countKey);
      const readAt = new Date().toISOString();
      const moved = previousUnread.map((notification) => ({ ...notification, readAt }));
      const nextRead = sortByCreatedAt([...moved, ...previousRead]);

      queryClient.setQueryData(unreadKey, []);
      queryClient.setQueryData(readKey, nextRead);
      queryClient.setQueryData(countKey, 0);

      return { previousUnread, previousRead, previousCount };
    },
    onError: (error, _vars, context) => {
      if (context?.previousUnread) {
        queryClient.setQueryData(unreadKey, context.previousUnread);
      }
      if (context?.previousRead) {
        queryClient.setQueryData(readKey, context.previousRead);
      }
      if (typeof context?.previousCount === 'number') {
        queryClient.setQueryData(countKey, context.previousCount);
      }
      toast.error((error as Error)?.message || 'Falha ao limpar notificações.');
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: unreadKey });
      await queryClient.invalidateQueries({ queryKey: readKey });
      await queryClient.invalidateQueries({ queryKey: countKey });
    },
  });

  if (!playerId) return null;

  const renderList = (items: Notification[], emptyLabel: string, isLoading: boolean) => {
    if (isLoading) {
      return <div className="text-xs text-[#7F94B0] py-6 text-center">Carregando notificações...</div>;
    }
    if (!items.length) {
      return <div className="text-xs text-[#7F94B0] py-6 text-center">{emptyLabel}</div>;
    }
    return (
      <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar pr-1">
        {items.map((notification) => {
          const accent = notification.type === 'praise' ? 'text-[#00F0FF]' : 'text-[#D4A536]';
          const border = notification.readAt ? 'border-[#2D3A52]' : 'border-[#00F0FF]/40';
          const hover = notification.readAt ? 'hover:border-[#2D3A52]' : 'hover:border-[#00F0FF]';
          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => {
                if (!notification.readAt) {
                  markAsRead.mutate(notification.id);
                }
              }}
              className={`w-full text-left rounded-lg border ${border} ${hover} bg-[#0B0E14]/80 px-3 py-2 transition-colors`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-mono-technical uppercase tracking-wider ${accent}`}>
                  {notification.type === 'praise' ? 'Elogio' : 'Denúncia'}
                </span>
                <span className="text-[10px] text-[#7F94B0]">{formatTimestamp(notification.createdAt)}</span>
              </div>
              <p className="text-sm text-[#E6F1FF] leading-snug mt-1">{notification.message}</p>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notificações"
          className="relative w-10 h-10 rounded-full border border-[#2D3A52] bg-[#0F1622] flex items-center justify-center text-[#E6F1FF] hover:border-[#00F0FF]/60 hover:text-[#00F0FF] transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00F0FF] text-[#0B0E14] text-[10px] font-mono-technical flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[90vw] max-w-[22rem] bg-[#0F1622]/95 border border-[#2D3A52] p-3 shadow-[0_0_30px_rgba(0,240,255,0.1)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono-technical uppercase tracking-wider text-[#7F94B0]">Notificações</p>
            <p className="text-sm text-[#E6F1FF]">Transmissões recentes</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (unreadNotifications.length) {
                markAllAsRead.mutate();
              }
            }}
            disabled={!unreadNotifications.length || markAllAsRead.isPending}
            className="text-[10px] font-mono-technical uppercase tracking-wider px-2 py-1 border border-[#2D3A52] rounded-md text-[#7F94B0] hover:text-[#E6F1FF] hover:border-[#00F0FF]/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpar tudo
          </button>
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as NotificationTab)} className="mt-3">
          <TabsList className="w-full bg-[#0B0E14] border border-[#2D3A52]">
            <TabsTrigger
              value="unread"
              className="text-xs font-mono-technical uppercase tracking-wider data-[state=active]:bg-[#00F0FF]/10 data-[state=active]:text-[#00F0FF]"
            >
              Não lidas {unreadCount > 0 ? `(${unreadCount})` : ''}
            </TabsTrigger>
            <TabsTrigger
              value="read"
              className="text-xs font-mono-technical uppercase tracking-wider data-[state=active]:bg-[#D4A536]/10 data-[state=active]:text-[#D4A536]"
            >
              Lidas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread">
            {renderList(unreadNotifications, 'Nenhuma notificação não lida.', unreadLoading)}
          </TabsContent>
          <TabsContent value="read">
            {renderList(readNotifications, 'Nenhuma notificação lida ainda.', readLoading)}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
