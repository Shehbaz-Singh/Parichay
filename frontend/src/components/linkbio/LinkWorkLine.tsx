'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, Moon } from 'lucide-react';
import { WEEK_DAYS, type WorkingHours } from '@parichay/shared';
import { fill, type Ui } from '@/lib/i18n';
import { dayName, formatClock, formatMinutes, isoInZone, workStatus } from '@/lib/work-time';
import { fillNodes } from '../themes/WorkCard';

// The "working together" status on the link-in-bio card, as two short lines: the owner's time now and
// whether they are within working hours. It is the small version of the portfolio's Working together
// card (no weekly table, no comparison with the visitor's zone), so the card stays light.
//
// The server draws it with the time it rendered at, the browser takes over once loaded and moves the
// clock on once a minute. Without JavaScript the time is simply the moment the page was made. The
// clock is deliberately not a live region: a screen reader would announce it every minute.
export function LinkWorkLine({
  work,
  ui,
  locale,
}: {
  work: { timezone: string; hours: WorkingHours; name: string; serverNow: string };
  ui: Ui;
  locale: string;
}) {
  const t = ui.work;
  const { timezone, hours, name } = work;
  const [now, setNow] = useState(() => new Date(work.serverNow));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const hasHours = WEEK_DAYS.some((day) => hours[day].length > 0);
  const status = hasHours ? workStatus(hours, now, timezone) : null;

  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium [overflow-wrap:anywhere]">
        {fillNodes(t.localTime, {
          time: (
            <time dateTime={isoInZone(now, timezone)} className="tabular-nums">
              {formatClock(now, timezone, locale)}
            </time>
          ),
          name,
        })}
      </p>
      {status && (
        <p className="flex items-start justify-center gap-2 text-muted">
          {status.state === 'open' ? (
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          ) : (
            <Moon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )}
          <span className="[overflow-wrap:anywhere]">
            {status.state === 'open'
              ? fill(t.statusOpenUntil, { time: formatMinutes(status.until, locale) })
              : status.next
                ? status.next.today
                  ? fill(t.statusBackToday, { time: formatMinutes(status.next.start, locale) })
                  : fill(t.statusBack, {
                      day: dayName(status.next.day, locale),
                      time: formatMinutes(status.next.start, locale),
                    })
                : t.statusClosed}
          </span>
        </p>
      )}
    </div>
  );
}
