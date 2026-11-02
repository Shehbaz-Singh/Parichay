'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ContactUnread } from '@parichay/shared';
import { api } from '@/lib/client-api';

// How many messages from the contact form are waiting, for the menu and the browser tab. It is
// fetched when the dashboard opens and again every minute while the tab is visible: plain polling
// (no WebSockets, nothing held open), so it is light on the free tier, and a tab in the background
// asks for nothing. Nothing is emailed, so this is how an owner finds out.
const POLL_MS = 60_000;
const TITLE_COUNT = /^\(\d+\)\s/;

interface MessagesValue {
  unread: number;
  // The Messages page knows the exact count after loading or changing something.
  setUnread: (count: number) => void;
  refresh: () => Promise<void>;
}

const MessagesContext = createContext<MessagesValue | null>(null);

export function useMessages(): MessagesValue {
  const value = useContext(MessagesContext);
  if (!value) throw new Error('useMessages must be used inside <MessagesProvider>');
  return value;
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [unread, setUnreadState] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const known = useRef<number | null>(null); // the last count seen; null until the first answer
  const clear = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Screen readers hear about new messages politely, and only when the count went up: not on the
  // first load and not on every poll.
  const apply = useCallback((count: number, announce: boolean) => {
    const before = known.current;
    known.current = count;
    setUnreadState(count);
    if (announce && before !== null && count > before) {
      setAnnouncement(
        count === 1 ? 'You have a new message.' : `You have ${count} unread messages.`,
      );
      clearTimeout(clear.current);
      clear.current = setTimeout(() => setAnnouncement(''), 6000);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { unread: count } = await api<ContactUnread>('/profile/me/messages/unread-count');
      apply(count, true);
    } catch {
      // A failed poll changes nothing: the next one tries again.
    }
  }, [apply]);

  const setUnread = useCallback((count: number) => apply(count, false), [apply]);

  useEffect(() => {
    void refresh();
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      stop();
      timer = setInterval(() => void refresh(), POLL_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
        start();
      } else stop();
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(clear.current);
    };
  }, [refresh]);

  // "(2) Messages | Parichay": the count goes in front of whatever title the page has. Next sets a new
  // title on every move between pages, so the count is put back each time it changes.
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(TITLE_COUNT, '');
      const next = unread > 0 ? `(${unread}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      document.title = document.title.replace(TITLE_COUNT, '');
    };
  }, [unread]);

  const value = useMemo(() => ({ unread, setUnread, refresh }), [unread, setUnread, refresh]);
  return (
    <MessagesContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </MessagesContext.Provider>
  );
}
