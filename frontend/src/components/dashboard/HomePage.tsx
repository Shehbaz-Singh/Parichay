'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';
import {
  ExternalLink,
  FileDown,
  Inbox,
  Languages,
  LayoutList,
  MessageSquareQuote,
  Palette,
  Share2,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Skeleton, buttonStyles } from '../ui';
import { cx } from '../ui/cx';
import { Completeness } from './Completeness';
import { useEditor } from './editor-context';
import { Greeting } from './Greeting';
import { SectionCard } from './layout';
import { useMessages } from './messages-context';
import { useGo } from './navigation';

// A link to another dashboard page that goes through the unsaved-changes check, like the menu does.
function GoLink({
  href,
  tab,
  icon: Icon,
  children,
}: {
  href: string;
  tab?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  const go = useGo();
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    void go(href, tab);
  }
  return (
    <Link href={href} onClick={onClick} className={quick}>
      <Icon aria-hidden="true" className="size-4" />
      {children}
    </Link>
  );
}

const quick = cx(buttonStyles(), 'w-full justify-start');

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

// The landing screen: where the page stands and what to do next. It is short on purpose. The
// publish switch, link and share buttons are in the bar above, so they are not repeated here.
export function HomePage() {
  const { profile } = useEditor();
  const { unread, loaded } = useMessages();
  const pending = profile.testimonials.filter((t) => t.status === 'pending').length;
  const published = (profile.posts ?? []).filter((p) => p.status === 'published').length;
  const waiting = unread + pending;

  return (
    <div className="space-y-6">
      <Greeting />
      <Completeness />

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="Waiting for you">
          {!loaded ? (
            <div aria-hidden="true" className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-32" />
            </div>
          ) : waiting === 0 ? (
            <p className="text-sm text-muted">
              Nothing is waiting. New messages and testimonials show up here.
            </p>
          ) : (
            <ul className="space-y-2">
              {unread > 0 && (
                <li>
                  <GoLink href="/dashboard/messages" icon={Inbox}>
                    {unread} unread {unread === 1 ? 'message' : 'messages'}
                  </GoLink>
                </li>
              )}
              {pending > 0 && (
                <li>
                  <GoLink href="/dashboard/testimonials" icon={MessageSquareQuote}>
                    {pending} {pending === 1 ? 'testimonial' : 'testimonials'} to review
                  </GoLink>
                </li>
              )}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="On your page"
          description={
            profile.published ? 'Your page is live.' : 'Still a draft: only you can see it.'
          }
        >
          <dl className="grid grid-cols-3 gap-4">
            <Stat label="Skills" value={profile.skills.length} />
            <Stat label="Jobs" value={profile.experience.length} />
            <Stat label="Projects" value={profile.projects.length} />
            <Stat label="Education" value={profile.education.length} />
            <Stat label="Posts" value={published} />
            <Stat
              label="Testimonials"
              value={profile.testimonials.filter((t) => t.status === 'approved').length}
            />
          </dl>
        </SectionCard>
      </div>

      <SectionCard title="Quick actions">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <GoLink href="/dashboard/profile" tab="basics" icon={UserRound}>
              Edit my profile
            </GoLink>
          </li>
          <li>
            <GoLink href="/dashboard/themes" icon={Palette}>
              Change the look
            </GoLink>
          </li>
          <li>
            <GoLink href="/dashboard/sections" icon={LayoutList}>
              Reorder sections
            </GoLink>
          </li>
          <li>
            <GoLink href="/dashboard/languages" icon={Languages}>
              Add a language
            </GoLink>
          </li>
          <li>
            <GoLink href="/dashboard/extras" icon={Share2}>
              Share &amp; extras
            </GoLink>
          </li>
          {profile.published && (
            <li>
              <a
                href={`/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={quick}
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                Open my page
                <span className="sr-only"> in a new tab</span>
              </a>
            </li>
          )}
          {profile.published && profile.resumeEnabled && (
            <li>
              <a href={`/${profile.slug}/resume.pdf`} download className={quick}>
                <FileDown aria-hidden="true" className="size-4" />
                Download my resume
              </a>
            </li>
          )}
        </ul>
      </SectionCard>
    </div>
  );
}
