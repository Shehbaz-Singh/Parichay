import {
  SECTION_LABELS,
  TRANSLATABLE,
  isCustomKey,
  normalizeSectionConfig,
  type MyProfile,
  type TranslatableEntity,
  type TranslatableField,
} from '@parichay/shared';

// The texts of a profile that can be translated, laid out the way the page is, for the dashboard's
// translation editor. Only fields that have text in the default language are listed (the same rule
// the API uses for the completeness figure). The one exception is a post's body, which is not part
// of the profile the dashboard holds: it is fetched when the owner opens it.

export interface FieldSpec {
  entityType: TranslatableEntity;
  entityId: string;
  field: string;
  label: string;
  rule: TranslatableField;
  // The text in the default language; null for a post body that has not been fetched yet.
  source: string | null;
  lazyPostId?: string;
}

export interface FieldCard {
  key: string;
  heading: string | null;
  fields: FieldSpec[];
}

export interface FieldGroup {
  id: string;
  title: string;
  note?: string;
  cards: FieldCard[];
}

export const fieldKey = (spec: Pick<FieldSpec, 'entityType' | 'entityId' | 'field'>) =>
  `${spec.entityType}:${spec.entityId}:${spec.field}`;

const LABELS: Partial<Record<TranslatableEntity, Record<string, string>>> = {
  profile: {
    tagline: 'Tagline',
    about: 'About',
    availabilityMessage: 'Availability message',
    workNote: 'Working together note',
    shareMessage: 'Share message',
    contactFormIntro: 'Contact form intro',
  },
  section: { title: 'Heading' },
  linkBioLink: { label: 'Button text' },
  experience: { title: 'Job title', description: 'Description' },
  education: { degree: 'Degree' },
  project: { name: 'Project name', description: 'Description' },
  skill: { name: 'Skill name' },
  customSection: { title: 'Section title' },
  customItem: { title: 'Title', subtitle: 'Subtitle', description: 'Description' },
  post: { title: 'Title', excerpt: 'Excerpt', body: 'Body' },
};

function spec(
  entityType: TranslatableEntity,
  entityId: string,
  field: string,
  source: string | null | undefined,
  extra: Partial<FieldSpec> = {},
): FieldSpec | null {
  const rule = TRANSLATABLE[entityType][field];
  if (!rule) return null;
  const text = source?.trim() ? source : null;
  if (text === null && !extra.lazyPostId) return null;
  return {
    entityType,
    entityId,
    field,
    label: LABELS[entityType]?.[field] ?? field,
    rule,
    source: text,
    ...extra,
  };
}

const card = (key: string, heading: string | null, fields: (FieldSpec | null)[]): FieldCard => ({
  key,
  heading,
  fields: fields.filter((f): f is FieldSpec => f !== null),
});

export function buildGroups(profile: MyProfile): FieldGroup[] {
  const groups: FieldGroup[] = [];
  const add = (group: Omit<FieldGroup, 'cards'>, cards: FieldCard[]) => {
    const filled = cards.filter((c) => c.fields.length > 0);
    if (filled.length > 0) groups.push({ ...group, cards: filled });
  };

  add({ id: 'profile', title: 'Profile' }, [
    card('profile', null, [
      spec('profile', profile.id, 'tagline', profile.tagline),
      spec('profile', profile.id, 'about', profile.about),
      spec('profile', profile.id, 'availabilityMessage', profile.availabilityMessage),
      spec('profile', profile.id, 'workNote', profile.workCardEnabled ? profile.workNote : null),
      spec('profile', profile.id, 'shareMessage', profile.shareMessage),
      spec(
        'profile',
        profile.id,
        'contactFormIntro',
        profile.contactFormEnabled ? profile.contactFormIntro : null,
      ),
    ]),
  ]);

  add(
    {
      id: 'linkbio',
      title: 'Link-in-bio buttons',
      note: 'The texts of your own buttons. The links are the same in every language.',
    },
    (profile.linkBioEnabled ? profile.linkBioLinks : []).map((row) =>
      card(row.id, row.label, [spec('linkBioLink', row.id, 'label', row.label)]),
    ),
  );

  const config = normalizeSectionConfig(
    profile.sectionConfig,
    profile.customSections.map((section) => section.id),
  );
  add(
    {
      id: 'sections',
      title: 'Section headings',
      note: 'Only headings you renamed are listed. The standard headings are translated by the page itself.',
    },
    config.flatMap((item) =>
      isCustomKey(item.key)
        ? []
        : [
            card(`section:${item.key}`, SECTION_LABELS[item.key], [
              spec('section', item.key, 'title', item.title),
            ]),
          ],
    ),
  );

  add(
    { id: 'experience', title: 'Experience' },
    profile.experience.map((row) =>
      card(row.id, `${row.title}, ${row.company}`, [
        spec('experience', row.id, 'title', row.title),
        spec('experience', row.id, 'description', row.description),
      ]),
    ),
  );
  add(
    { id: 'education', title: 'Education' },
    profile.education.map((row) =>
      card(row.id, `${row.degree}, ${row.institution}`, [
        spec('education', row.id, 'degree', row.degree),
      ]),
    ),
  );
  add(
    { id: 'projects', title: 'Projects' },
    profile.projects.map((row) =>
      card(row.id, row.name, [
        spec('project', row.id, 'name', row.name),
        spec('project', row.id, 'description', row.description),
      ]),
    ),
  );
  add(
    {
      id: 'skills',
      title: 'Skills',
      note: 'Optional. A skill you leave untranslated stays as written and does not count towards completeness.',
    },
    profile.skills.map((row) => card(row.id, null, [spec('skill', row.id, 'name', row.name)])),
  );
  add(
    { id: 'custom', title: 'Custom sections' },
    profile.customSections.flatMap((section) => [
      card(`cs:${section.id}`, `Section: ${section.title}`, [
        spec('customSection', section.id, 'title', section.title),
      ]),
      ...section.items.map((item) =>
        card(item.id, `${section.title}: ${item.title}`, [
          spec('customItem', item.id, 'title', item.title),
          spec('customItem', item.id, 'subtitle', item.subtitle),
          spec('customItem', item.id, 'description', item.description),
        ]),
      ),
    ]),
  );
  add(
    { id: 'writing', title: 'Writing' },
    (profile.posts ?? []).map((post) =>
      card(post.id, post.title, [
        spec('post', post.id, 'title', post.title),
        spec('post', post.id, 'excerpt', post.excerpt),
        // A link to an article has no body of its own.
        post.type === 'post' ? spec('post', post.id, 'body', null, { lazyPostId: post.id }) : null,
      ]),
    ),
  );
  return groups;
}
