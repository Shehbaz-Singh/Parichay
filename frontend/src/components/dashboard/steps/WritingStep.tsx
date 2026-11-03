'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Link2, PenLine, Plus } from 'lucide-react';
import { MAX_POSTS, type MyPostSummary } from '@parichay/shared';
import { api } from '@/lib/client-api';
import { formatDate } from '@/lib/format';
import { Badge, Button, Card, EmptyState, useConfirm } from '../../ui';
import { useEditor } from '../editor-context';
import { useGo } from '../navigation';
import { PostEditor } from './PostEditor';
import { NOTICES, CONFIRMS } from '@/lib/messages';

function PostRow({
  post,
  busy,
  onEdit,
  onDelete,
}: {
  post: MyPostSummary;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const published = post.status === 'published';
  const Icon = post.type === 'link' ? Link2 : FileText;
  return (
    <li>
      <Card padding="sm" className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex min-w-0 items-center gap-2 font-medium">
            <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" />
            <span className="truncate">{post.title}</span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            {/* The words carry the status; the tone only backs them up. */}
            <Badge tone={published ? 'accent' : 'warning'}>
              {published ? 'Published' : 'Draft'}
            </Badge>
            <span>{post.type === 'link' ? 'Link to an article' : 'Post'}</span>
            <span>
              {published && post.publishedAt
                ? `Published ${formatDate(post.publishedAt)}`
                : `Edited ${formatDate(post.updatedAt)}`}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={busy} onClick={onEdit}>
            Edit<span className="sr-only"> {post.title}</span>
          </Button>
          <Button size="sm" variant="danger" disabled={busy} onClick={onDelete}>
            Delete<span className="sr-only"> {post.title}</span>
          </Button>
        </div>
      </Card>
    </li>
  );
}

// The Writing tab: your posts and links to articles, newest first, and the editor for one.
export function WritingStep() {
  const { profile, update, attempt, jump, clearJump } = useEditor();
  const confirm = useConfirm();
  const go = useGo();
  // A post id, "new", or nothing (the list).
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const wasEditing = useRef(false);

  // The command palette asked for one post: open its editor.
  useEffect(() => {
    if (jump?.kind !== 'post' || !(profile.posts ?? []).some((post) => post.id === jump.id)) return;
    setEditing(jump.id);
    clearJump();
  }, [jump, profile.posts, clearJump]);

  // Coming back to the list puts the keyboard at the top of it, not nowhere.
  useEffect(() => {
    if (editing === null && wasEditing.current) heading.current?.focus();
    wasEditing.current = editing !== null;
  }, [editing]);

  const posts = profile.posts ?? [];
  const full = posts.length >= MAX_POSTS;
  const sectionOn = profile.sectionConfig.some((s) => s.key === 'writing' && s.visible);

  async function remove(post: MyPostSummary) {
    const ok = await confirm({
      title: 'Delete this post?',
      message: CONFIRMS.deletePost(post.title),
      confirmLabel: 'Delete',
      cancelLabel: 'Keep it',
      danger: true,
    });
    if (!ok) return;
    setDeleting(post.id);
    await attempt(async () => {
      await api(`/profile/me/posts/${post.id}`, { method: 'DELETE' });
      update((p) => ({ ...p, posts: p.posts.filter((item) => item.id !== post.id) }));
    }, NOTICES.deleted);
    setDeleting(null);
  }

  if (editing !== null) {
    return (
      <PostEditor
        key={editing}
        id={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <section aria-labelledby="writing-heading" className="space-y-4">
      <div>
        <h2 id="writing-heading" ref={heading} tabIndex={-1} className="type-section">
          Writing
        </h2>
        <p className="text-sm text-muted">
          Short posts you write here, and links to articles you’ve published elsewhere. Drafts stay
          private until you publish them.
        </p>
      </div>

      {!sectionOn && (
        <Card tone="warning" padding="sm" className="flex flex-wrap items-center gap-3 text-sm">
          <p className="min-w-0 flex-1">
            Your Writing section is switched off, so visitors don’t see these yet.
          </p>
          <Button size="sm" onClick={() => void go('/dashboard/sections')}>
            Switch it on
          </Button>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card dashed padding="lg">
          <EmptyState
            icon={PenLine}
            title="Nothing written yet"
            action={
              <Button variant="primary" onClick={() => setEditing('new')}>
                <Plus aria-hidden="true" className="size-4" />
                Add your first post
              </Button>
            }
          >
            Share what you’ve learned, or point to an article you’re proud of. It’s a good way to
            show how you think.
          </EmptyState>
        </Card>
      ) : (
        <>
          <ul className="space-y-2">
            {posts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                busy={deleting === post.id}
                onEdit={() => setEditing(post.id)}
                onDelete={() => void remove(post)}
              />
            ))}
          </ul>
          {full ? (
            <p className="text-sm text-muted">
              You’ve reached the limit of {MAX_POSTS} posts. Delete one to add another.
            </p>
          ) : (
            <Button onClick={() => setEditing('new')}>
              <Plus aria-hidden="true" className="size-4" />
              Add a post
            </Button>
          )}
        </>
      )}
    </section>
  );
}
