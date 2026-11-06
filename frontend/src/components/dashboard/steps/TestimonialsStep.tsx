'use client';

import { MessageSquareQuote } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import {
  MAX_TESTIMONIALS,
  TESTIMONIAL_COMPANY_MAX,
  TESTIMONIAL_EMAIL_MAX,
  TESTIMONIAL_MESSAGE_MAX,
  TESTIMONIAL_NAME_MAX,
  TESTIMONIAL_ROLE_MAX,
  testimonialInputSchema,
  type MyTestimonial,
  type SectionConfig,
  type TestimonialInput,
} from '@parichay/shared';
import { api } from '@/lib/client-api';
import { schemaResolver } from '@/lib/form';
import { TextArea, TextField } from '../../form-fields';
import { Badge, Button, Card, EmptyState, Switch, useConfirm } from '../../ui';
import { EditorForm } from '../EditorForm';
import { ListManager, type FormProps } from '../SectionManager';
import { useEditor, useTestimonials } from '../editor-context';
import { NOTICES, CONFIRMS } from '@/lib/messages';

type Fields = {
  authorName: string;
  authorRole: string;
  authorCompany: string;
  message: string;
  contactEmail: string;
};

const detailOf = (item: MyTestimonial) =>
  [item.authorRole, item.authorCompany].filter(Boolean).join(', ');

// ---- the add and edit form (also used by the approved list's Add and Edit)

function TestimonialForm({ item, onDone, onSaved }: FormProps<MyTestimonial>) {
  const { create, updateItem } = useTestimonials();
  const { notify } = useEditor();
  const form = useForm<Fields, unknown, TestimonialInput>({
    resolver: schemaResolver(testimonialInputSchema),
    defaultValues: {
      authorName: item?.authorName ?? '',
      authorRole: item?.authorRole ?? '',
      authorCompany: item?.authorCompany ?? '',
      message: item?.message ?? '',
      contactEmail: item?.contactEmail ?? '',
    },
  });

  async function onSubmit(values: TestimonialInput) {
    await (item ? updateItem(item.id, values) : create(values));
    notify('success', item ? NOTICES.testimonialSaved : NOTICES.testimonialAdded);
    onSaved?.();
    onDone();
  }

  return (
    <EditorForm
      form={form}
      onSubmit={onSubmit}
      submitLabel={item ? 'Save testimonial' : 'Add testimonial'}
      onCancel={onDone}
    >
      <TextField
        name="authorName"
        label="Name"
        placeholder="e.g. Marcus Lee"
        maxLength={TESTIMONIAL_NAME_MAX}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="authorRole"
          label="Role (optional)"
          placeholder="e.g. Engineering Manager"
          maxLength={TESTIMONIAL_ROLE_MAX}
        />
        <TextField
          name="authorCompany"
          label="Company (optional)"
          placeholder="e.g. Northwind"
          maxLength={TESTIMONIAL_COMPANY_MAX}
        />
      </div>
      <TextArea
        name="message"
        label="Testimonial"
        rows={5}
        maxLength={TESTIMONIAL_MESSAGE_MAX}
        hint={`Use their own words, from 20 to ${TESTIMONIAL_MESSAGE_MAX} characters.${item ? '' : ' It goes on your page as soon as you add it.'}`}
        required
      />
      <TextField
        name="contactEmail"
        label="Email (optional)"
        type="email"
        maxLength={TESTIMONIAL_EMAIL_MAX}
        hint="For your records. It is never shown on your page."
      />
    </EditorForm>
  );
}

// ---- pending and rejected: cards with approve / reject / delete

// A titled list of testimonials awaiting a decision. After an action the card is gone, so focus
// goes to the heading: the keyboard stays where the work is.
function ReviewList({
  id,
  title,
  items,
  empty,
  actions,
}: {
  id: string;
  title: string;
  items: MyTestimonial[];
  empty?: string;
  actions: (item: MyTestimonial, done: () => void) => ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const done = () => heading.current?.focus();
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h3
        id={id}
        ref={heading}
        tabIndex={-1}
        className="type-subsection flex items-center gap-2 focus:outline-none"
      >
        {title}
        {items.length > 0 && <Badge tone="solid">{items.length}</Badge>}
      </h3>
      {items.length === 0 && empty && <EmptyState>{empty}</EmptyState>}
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <Card as="li" key={item.id} className="space-y-3">
              <blockquote className="whitespace-pre-line">{item.message}</blockquote>
              <p className="text-sm">
                <span className="font-medium">{item.authorName}</span>
                {detailOf(item) && <span className="text-muted">, {detailOf(item)}</span>}
              </p>
              {item.contactEmail && (
                <p className="text-sm text-muted">
                  Email:{' '}
                  <a href={`mailto:${item.contactEmail}`} className="text-accent-fg underline">
                    {item.contactEmail}
                  </a>
                  . Only you can see it.
                </p>
              )}
              <div className="flex flex-wrap gap-2">{actions(item, done)}</div>
            </Card>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---- the step

export function TestimonialsStep() {
  const t = useTestimonials();
  const confirm = useConfirm();
  const { profile, update, attempt } = useEditor();
  const [busy, setBusy] = useState<string | null>(null);
  const sectionShown =
    profile.sectionConfig.find((section) => section.key === 'testimonials')?.visible ?? false;

  // Runs one API call, disables its buttons meanwhile and says what happened.
  async function run(
    key: string,
    action: () => Promise<void>,
    success: string,
    after?: () => void,
  ) {
    setBusy(key);
    if (await attempt(action, success)) after?.();
    setBusy(null);
  }

  const toggleAccepting = () =>
    run(
      'accepting',
      () => t.setAccepting(!t.accepting),
      t.accepting ? NOTICES.testimonialsOff : NOTICES.testimonialsOn,
    );

  // Switches the page section on, the same as the switch in the Sections step.
  const showSection = () =>
    run(
      'section',
      async () => {
        const sections = profile.sectionConfig.map((section) =>
          section.key === 'testimonials' ? { ...section, visible: true } : section,
        );
        const saved = await api<{ sections: SectionConfig }>('/profile/me/sections', {
          method: 'PUT',
          body: { sections },
        });
        update((p) => ({ ...p, sectionConfig: saved.sections }));
      },
      NOTICES.testimonialsShown,
    );

  const confirmDelete = async (item: MyTestimonial, done: () => void) => {
    const sure = await confirm({
      title: 'Delete this testimonial?',
      message: CONFIRMS.deleteTestimonial(item.authorName),
      confirmLabel: 'Delete',
      danger: true,
    });
    if (sure) void run(item.id, () => t.remove(item.id), NOTICES.testimonialDeleted, done);
  };

  const approve = (item: MyTestimonial, done: () => void) =>
    run(item.id, () => t.approve(item.id), NOTICES.testimonialApproved(item.authorName), done);

  const remaining = MAX_TESTIMONIALS - t.pending.length - t.rejected.length;

  return (
    <section aria-label="Testimonials" className="space-y-6">
      <p className="text-sm text-muted">
        Visitors can send one from your page; it stays hidden until you approve it. You can also add
        one yourself.
      </p>

      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">Accept testimonials</p>
            <p className="text-sm text-muted">
              Adds a “Leave a testimonial” button to the Testimonials section of your page.
            </p>
          </div>
          <span className="text-sm text-muted">{t.accepting ? 'On' : 'Off'}</span>
          <Switch
            checked={t.accepting}
            label="Accept testimonials"
            disabled={busy === 'accepting'}
            onClick={toggleAccepting}
          />
        </div>
        {!sectionShown && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            The Testimonials section is hidden, so nothing shows on your page yet.
            <Button disabled={busy === 'section'} onClick={showSection}>
              Show it on my page
            </Button>
          </p>
        )}
      </Card>

      <ReviewList
        id="testimonials-pending"
        title="Pending review"
        items={t.pending}
        empty="You’re all caught up. New testimonials from visitors will wait here for your OK."
        actions={(item, done) => (
          <>
            <Button
              variant="primary"
              disabled={busy === item.id}
              onClick={() => approve(item, done)}
              aria-label={`Approve the testimonial from ${item.authorName}`}
            >
              Approve
            </Button>
            <Button
              disabled={busy === item.id}
              onClick={() =>
                run(
                  item.id,
                  () => t.reject(item.id),
                  NOTICES.testimonialRejected(item.authorName),
                  done,
                )
              }
              aria-label={`Reject the testimonial from ${item.authorName}`}
            >
              Reject
            </Button>
            <Button
              variant="danger"
              disabled={busy === item.id}
              onClick={() => confirmDelete(item, done)}
              aria-label={`Delete the testimonial from ${item.authorName}`}
            >
              Delete
            </Button>
          </>
        )}
      />

      <section aria-labelledby="testimonials-approved" className="space-y-3">
        <div>
          <h3 id="testimonials-approved" className="type-subsection">
            Approved
          </h3>
          <p className="text-sm text-muted">
            These appear on your page, in this order. Drag to reorder.
          </p>
        </div>
        <ListManager
          list={{ items: t.approved, create: t.create, remove: t.remove, reorder: t.reorder }}
          noun="testimonial"
          jumpKind="testimonial"
          addLabel="Add a testimonial"
          icon={MessageSquareQuote}
          empty="Nothing here yet. Approve one from the list above, or add a kind word someone shared with you."
          limit={remaining}
          summary={(item) => ({
            title: item.authorName,
            subtitle: [detailOf(item), item.message].filter(Boolean).join(' · '),
          })}
          Form={TestimonialForm}
          extra={(item) => (
            <Button
              variant="ghost"
              disabled={busy === item.id}
              onClick={() =>
                run(item.id, () => t.reject(item.id), NOTICES.testimonialRemoved(item.authorName))
              }
              aria-label={`Reject the testimonial from ${item.authorName}`}
            >
              Reject
            </Button>
          )}
        />
      </section>

      {t.rejected.length > 0 && (
        <ReviewList
          id="testimonials-rejected"
          title="Rejected"
          items={t.rejected}
          actions={(item, done) => (
            <>
              <Button
                disabled={busy === item.id}
                onClick={() => approve(item, done)}
                aria-label={`Approve the testimonial from ${item.authorName}`}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                disabled={busy === item.id}
                onClick={() => confirmDelete(item, done)}
                aria-label={`Delete the testimonial from ${item.authorName}`}
              >
                Delete
              </Button>
            </>
          )}
        />
      )}
    </section>
  );
}
