import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/lib/queries';
import { fmtAgo } from '@/lib/format';
import type { NotifKind } from '@/lib/types';
import { Button, IconButton, Skeleton } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, ErrorState } from '@/components/ui/feedback';

const ICON: Record<NotifKind, string> = {
  predictions_open: 'sparkles', deadline_soon: 'clock', results_published: 'flag', points_awarded: 'star', badge_earned: 'medal', rank_jump: 'trending-up',
};

export function Notifications() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const notifs = useNotifications();
  const list = notifs.data ?? [];

  async function markAll() {
    await supabase.rpc('mark_notifications_read');
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }
  async function open(id: string, link: string | null, read: boolean) {
    if (!read) await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['notifications'] });
    if (link) navigate(link);
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-3">
        <IconButton icon="arrow-left" label="Retour" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} />
        <Button variant="ghost" size="sm" onClick={markAll} disabled={!list.some((n) => !n.read_at)}>Tout marquer lu</Button>
      </div>
      <main className="flex flex-col gap-[18px] px-5 pb-[60px] pt-2.5">
        <h1 className="t-h1 m-0">Notifications</h1>
        {notifs.isLoading ? <Skeleton h={240} /> : notifs.isError ? <ErrorState onRetry={() => notifs.refetch()} /> : !list.length ? (
          <EmptyState icon="bell" title="Rien de neuf" message="On te prévient à l’ouverture des pronos, avant les clôtures et à chaque résultat." />
        ) : (
          <div className="flex flex-col">
            {list.map((n) => (
              <button key={n.id} type="button" onClick={() => open(n.id, n.link, !!n.read_at)} className="flex items-start gap-3 border-0 border-b border-solid border-subtle bg-transparent py-3.5 text-left">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/[.08] text-primary"><Icon name={ICON[n.kind]} size={16} /></span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="t-body-s font-bold">{n.title}</span>
                  {n.body && <span className="t-body-s text-secondary">{n.body}</span>}
                  <span className="t-caption text-muted">{fmtAgo(n.created_at)}</span>
                </div>
                {!n.read_at && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-flare-500" aria-label="Non lue" />}
              </button>
            ))}
          </div>
        )}
        <p className="t-caption m-0 text-muted">Désactive-les à tout moment depuis ton profil.</p>
      </main>
    </>
  );
}
