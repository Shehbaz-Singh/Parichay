'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { CircleCheck, Clock, Moon } from 'lucide-react';
import { WEEK_DAYS, minutesOf } from '@parichay/shared';
import { fill } from '@/lib/i18n';
import {
  browserZone,
  dayName,
  differenceMinutes,
  formatClock,
  formatMinutes,
  hoursInZone,
  isoInZone,
  workStatus,
  zonedFields,
} from '@/lib/work-time';
import type { WorkModel } from './blocks';
import { NewTabLink } from './parts';

// Puts values into a message that has {placeholders}, where a value may be an element (the <time>).
export function fillNodes(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((piece, index) => {
    const key = /^\{(\w+)\}$/.exec(piece)?.[1];
    return key && key in values ? <span key={index}>{values[key]}</span> : piece;
  });
}

const zoneName = (zone: string) => zone.replace(/_/g, ' ');

// The "Working together" card: the owner's time now, how far that is from the visitor's, whether
// they are at work, their weekly hours, and how to reach them. The look comes from the theme through
// the class names; the card's own text takes the color around it, so it reads on any background.
//
// The server draws it with the time it rendered at, and the browser takes over once loaded (no
// mismatch to repair), then moves the clock on once a minute. The clock is deliberately not a live
// region: a screen reader would otherwise announce it every minute.
export function WorkCard({
  work,
  className,
  linkClassName,
  buttonClassName,
}: {
  work: WorkModel;
  className: string; // the card's box: its background, border and padding
  linkClassName: string; // the contact link and other links
  buttonClassName: string; // the "show in my time zone" button
}) {
  const { ui, locale, timezone, hours, name } = work;
  const t = ui.work;
  const [now, setNow] = useState(() => new Date(work.serverNow));
  const [visitorZone, setVisitorZone] = useState<string | null>(null);
  const [mine, setMine] = useState(false);
  const listId = useId();

  useEffect(() => {
    setVisitorZone(browserZone());
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      // The next tick is on the minute: the clock shows minutes, so there is no use in more.
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

  const difference = visitorZone ? differenceMinutes(now, timezone, visitorZone) : null;
  const span = (minutes: number) =>
    [
      Math.floor(minutes / 60) > 0 && fill(t.hours, { count: Math.floor(minutes / 60) }),
      minutes % 60 > 0 && fill(t.minutes, { count: minutes % 60 }),
    ]
      .filter(Boolean)
      .join(' ');

  const range = (start: number, end: number) =>
    `${formatMinutes(start, locale)} – ${formatMinutes(end, locale)}`;
  const todayKey = zonedFields(now, timezone).weekday; // the owner's weekday, to mark today's row

  const mineRows = mine && visitorZone ? hoursInZone(hours, now, timezone, visitorZone) : null;

  return (
    <section aria-label={t.title} className={className}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Clock aria-hidden="true" className="size-4 shrink-0" />
        {t.title}
      </h3>

      <p className="mt-2 text-base font-semibold [overflow-wrap:anywhere]">
        {fillNodes(t.localTime, {
          time: (
            <time dateTime={isoInZone(now, timezone)} className="tabular-nums">
              {formatClock(now, timezone, locale)}
            </time>
          ),
          name,
        })}
      </p>
      {difference !== null && (
        <p className="text-sm opacity-80">
          {difference === 0
            ? t.same
            : fill(difference > 0 ? t.ahead : t.behind, { difference: span(Math.abs(difference)) })}
        </p>
      )}

      {status && (
        <p className="mt-3 flex items-start gap-2 text-sm font-medium">
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

      {hasHours && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">{t.weeklyHours}</summary>
          <p className="mt-2 text-xs opacity-80">
            {mineRows && visitorZone
              ? fill(t.shownYours, { zone: zoneName(visitorZone) })
              : fill(t.shownTheirs, { name, zone: zoneName(timezone) })}
          </p>
          <ul id={listId} className="mt-1 space-y-1">
            {mineRows
              ? mineRows.map((row, index) => (
                  <li key={index} className="flex flex-wrap justify-between gap-x-4">
                    <span>{dayName(row.day, locale)}</span>
                    <bdi className="tabular-nums">
                      {range(row.start, row.end)}
                      {row.endDay !== row.day && ` (${dayName(row.endDay, locale, 'short')})`}
                    </bdi>
                  </li>
                ))
              : WEEK_DAYS.map((day) => (
                  <li
                    key={day}
                    aria-current={day === todayKey ? 'date' : undefined}
                    className={`flex flex-wrap justify-between gap-x-4 ${day === todayKey ? 'font-semibold' : ''}`}
                  >
                    <span>{dayName(day, locale)}</span>
                    <bdi className="tabular-nums">
                      {hours[day].length === 0
                        ? t.closed
                        : hours[day]
                            .map((r) => range(minutesOf(r.start), minutesOf(r.end)))
                            .join(', ')}
                    </bdi>
                  </li>
                ))}
          </ul>
          {visitorZone && visitorZone !== timezone && (
            <button
              type="button"
              aria-pressed={mine}
              aria-controls={listId}
              onClick={() => setMine((value) => !value)}
              className={`mt-2 ${buttonClassName}`}
            >
              {mine ? fill(t.showTheirs, { name }) : t.showMine}
            </button>
          )}
        </details>
      )}

      {(work.reply || work.contact) && (
        <dl className="mt-3 space-y-1 text-sm">
          {work.reply && (
            <div className="flex flex-wrap gap-x-2">
              <dt className="opacity-80">{t.replyLabel}:</dt>
              <dd className="font-medium">{work.reply}</dd>
            </div>
          )}
          {work.contact && (
            <div className="flex flex-wrap gap-x-2">
              <dt className="opacity-80">{fill(t.reachLabel, { name })}:</dt>
              <dd className="font-medium">
                {work.contact.external ? (
                  <NewTabLink href={work.contact.href} className={linkClassName}>
                    {work.contact.label}
                  </NewTabLink>
                ) : (
                  <a href={work.contact.href} className={linkClassName}>
                    {work.contact.label}
                  </a>
                )}
              </dd>
            </div>
          )}
        </dl>
      )}

      {work.note && <p className="mt-3 text-sm italic [overflow-wrap:anywhere]">{work.note}</p>}
    </section>
  );
}
