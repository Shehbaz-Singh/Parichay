import {
  MAX_EXTRA_LANGUAGES,
  fieldRule,
  normalizeSectionConfig,
  translationKey,
  type LanguageStatus,
  type TranslatableEntity,
  type TranslationEntry,
} from '@parichay/shared';
import type { Prisma } from '../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { ERRORS } from '../lib/messages';
import { ownProfile } from '../lib/profile';

type Tx = Prisma.TransactionClient;

// ---- what there is to translate: the owner's own text in the default language

interface Source {
  // Every thing that can be translated, "type:id" (so a stored translation can be checked against it).
  entities: Set<string>;
  // The default-language text of each field that has some, by translationKey().
  texts: Map<string, string>;
}

const entityKey = (type: TranslatableEntity, id: string) => `${type}:${id}`;

export async function loadSource(profileId: string): Promise<Source> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      tagline: true,
      about: true,
      availabilityMessage: true,
      workNote: true,
      shareMessage: true,
      contactFormEnabled: true,
      contactFormIntro: true,
      linkBioEnabled: true,
      linkBioLinks: { select: { id: true, label: true } },
      workCardEnabled: true,
      sectionConfig: true,
      experience: { select: { id: true, title: true, description: true } },
      education: { select: { id: true, degree: true } },
      projects: { select: { id: true, name: true, description: true } },
      skills: { select: { id: true, name: true } },
      customSections: {
        select: {
          id: true,
          title: true,
          items: { select: { id: true, title: true, subtitle: true, description: true } },
        },
      },
      posts: { select: { id: true, title: true, excerpt: true, body: true, type: true } },
    },
  });
  if (!profile) throw AppError.notFound(ERRORS.profileNotFound);

  const entities = new Set<string>();
  const texts = new Map<string, string>();
  const add = (type: TranslatableEntity, id: string, values: Record<string, string | null>) => {
    entities.add(entityKey(type, id));
    for (const [field, value] of Object.entries(values)) {
      if (value && value.trim()) texts.set(translationKey(type, id, field), value);
    }
  };

  add('profile', profileId, {
    tagline: profile.tagline,
    about: profile.about,
    availabilityMessage: profile.availabilityMessage,
    // Only while the card is switched on: a note nobody can see is not a text to translate.
    workNote: profile.workCardEnabled ? profile.workNote : null,
    shareMessage: profile.shareMessage,
    // Only while the form is switched on, like the working-together note.
    contactFormIntro: profile.contactFormEnabled ? profile.contactFormIntro : null,
  });
  // A built-in heading is translatable when the owner has given it a title of their own; the default
  // headings come from the interface strings of each language.
  const config = normalizeSectionConfig(
    profile.sectionConfig,
    profile.customSections.map((section) => section.id),
  );
  for (const item of config) {
    if (!item.key.startsWith('custom:')) add('section', item.key, { title: item.title ?? null });
  }
  for (const row of profile.experience) add('experience', row.id, row);
  for (const row of profile.education) add('education', row.id, row);
  for (const row of profile.projects) add('project', row.id, row);
  for (const row of profile.skills) add('skill', row.id, row);
  for (const section of profile.customSections) {
    add('customSection', section.id, { title: section.title });
    for (const item of section.items) add('customItem', item.id, item);
  }
  // The labels of the link-in-bio buttons, only while the card is on (the addresses are not translated).
  if (profile.linkBioEnabled)
    for (const row of profile.linkBioLinks) add('linkBioLink', row.id, row);
  for (const post of profile.posts) {
    add('post', post.id, {
      title: post.title,
      excerpt: post.excerpt,
      // A link has no body of its own.
      body: post.type === 'post' ? post.body : null,
    });
  }
  return { entities, texts };
}

// ---- reading and the completeness figure

const toStored = (row: {
  entityType: TranslatableEntity;
  entityId: string;
  field: string;
  value: string;
  needsReview: boolean;
}) => ({
  entityType: row.entityType,
  entityId: row.entityId,
  field: row.field,
  value: row.value,
  needsReview: row.needsReview,
});

export async function listTranslations(profileId: string, locale: string) {
  const rows = await prisma.translation.findMany({
    where: { profileId, locale },
    select: rowSelect,
  });
  return rows.map(toStored);
}

// What the status math reads of a stored translation, and nothing more.
const rowSelect = {
  locale: true,
  entityType: true,
  entityId: true,
  field: true,
  value: true,
  needsReview: true,
} as const;

interface Row {
  locale: string;
  entityType: TranslatableEntity;
  entityId: string;
  field: string;
  value: string;
  needsReview: boolean;
}

// Fields that count towards completeness: the default language has text, and it is a field that
// counts (skill names are optional).
function countedKeys(source: Source) {
  return [...source.texts.keys()].filter((key) => {
    const [type, , field] = splitKey(key);
    return fieldRule(type, field)?.counts;
  });
}

function splitKey(key: string): [TranslatableEntity, string, string] {
  const first = key.indexOf(':');
  const last = key.lastIndexOf(':');
  return [
    key.slice(0, first) as TranslatableEntity,
    key.slice(first + 1, last),
    key.slice(last + 1),
  ];
}

export function statusFor(locale: string, source: Source, rows: Row[]): LanguageStatus {
  const mine = new Map(
    rows
      .filter((row) => row.locale === locale && row.value.trim())
      .map((row) => [translationKey(row.entityType, row.entityId, row.field), row]),
  );
  const counted = countedKeys(source);
  const done = counted.filter((key) => mine.has(key));
  const needsReview = counted.filter((key) => mine.get(key)?.needsReview).length;
  // The two fields that make a language worth publishing: where the default language has them.
  const required = counted.filter((key) => /^profile:[^:]+:(tagline|about)$/.test(key));
  // A suggestion still marked "needs review" counts: the flag is a reminder for the owner, not a gate.
  const publishable = required.every((key) => mine.has(key));
  return {
    locale: locale as LanguageStatus['locale'],
    total: counted.length,
    translated: done.length,
    needsReview,
    percent: counted.length === 0 ? 100 : Math.round((done.length / counted.length) * 100),
    publishable,
  };
}

export async function getLanguages(profileId: string) {
  const profile = await ownProfile(profileId, { defaultLocale: true, locales: true });
  const [source, rows] = await Promise.all([
    loadSource(profileId),
    prisma.translation.findMany({ where: { profileId }, select: rowSelect }),
  ]);
  return {
    defaultLocale: profile.defaultLocale,
    maxExtra: MAX_EXTRA_LANGUAGES,
    languages: profile.locales.map((locale) => statusFor(locale, source, rows)),
  };
}

// ---- saving

export async function saveTranslations(
  profileId: string,
  locale: string,
  entries: TranslationEntry[],
) {
  const profile = await ownProfile(profileId, { locales: true });
  if (!profile.locales.includes(locale)) {
    throw new AppError(400, 'LANGUAGE_NOT_ENABLED', ERRORS.languageNotEnabled);
  }
  const { entities } = await loadSource(profileId);
  for (const entry of entries) {
    if (!entities.has(entityKey(entry.entityType, entry.entityId))) {
      throw new AppError(400, 'UNKNOWN_ENTITY', ERRORS.textGone);
    }
  }

  await prisma.$transaction(
    entries.map((entry) => {
      const where = {
        profileId_locale_entityType_entityId_field: {
          profileId,
          locale,
          entityType: entry.entityType,
          entityId: entry.entityId,
          field: entry.field,
        },
      };
      // Clearing a field removes its translation, so the page falls back to the default language.
      if (!entry.value)
        return prisma.translation.deleteMany({
          where: {
            profileId,
            locale,
            entityType: entry.entityType,
            entityId: entry.entityId,
            field: entry.field,
          },
        });
      return prisma.translation.upsert({
        where,
        create: {
          profileId,
          locale,
          entityType: entry.entityType,
          entityId: entry.entityId,
          field: entry.field,
          value: entry.value,
          needsReview: entry.needsReview,
        },
        update: { value: entry.value, needsReview: entry.needsReview },
      });
    }),
  );
  return listTranslations(profileId, locale);
}

// ---- adding and removing languages

export async function addLanguage(profileId: string, locale: string) {
  const profile = await ownProfile(profileId, { defaultLocale: true, locales: true });
  if (locale === profile.defaultLocale) {
    throw new AppError(409, 'LANGUAGE_IS_DEFAULT', ERRORS.languageIsDefault);
  }
  if (profile.locales.includes(locale)) {
    throw new AppError(409, 'LANGUAGE_EXISTS', ERRORS.languageExists);
  }
  if (profile.locales.length >= MAX_EXTRA_LANGUAGES) {
    throw new AppError(409, 'LANGUAGE_LIMIT', ERRORS.languageLimit(MAX_EXTRA_LANGUAGES));
  }
  await prisma.profile.update({
    where: { id: profileId },
    data: { locales: [...profile.locales, locale] },
  });
  return getLanguages(profileId);
}

// Removing deletes only that language's texts; the default language is never touched.
export async function removeLanguage(profileId: string, locale: string) {
  const profile = await ownProfile(profileId, { locales: true });
  if (!profile.locales.includes(locale)) throw AppError.notFound(ERRORS.languageNotFound);
  await prisma.$transaction([
    prisma.translation.deleteMany({ where: { profileId, locale } }),
    prisma.profile.update({
      where: { id: profileId },
      data: { locales: profile.locales.filter((code) => code !== locale) },
    }),
  ]);
  return getLanguages(profileId);
}

// The main language can only change while no other language exists: translations are written
// against it, so changing it under them would leave them describing the wrong text.
export async function setDefaultLanguage(profileId: string, locale: string) {
  const profile = await ownProfile(profileId, { locales: true });
  if (profile.locales.length > 0) {
    throw new AppError(409, 'LANGUAGES_IN_USE', ERRORS.languagesInUse);
  }
  await prisma.profile.update({ where: { id: profileId }, data: { defaultLocale: locale } });
  return getLanguages(profileId);
}

// ---- keeping translations in step with what they translate

// Called in the same transaction that deletes the rows, so no translation outlives its text.
export async function deleteTranslationsFor(
  tx: Tx,
  profileId: string,
  entityType: TranslatableEntity,
  entityIds: string[],
) {
  if (entityIds.length === 0) return;
  await tx.translation.deleteMany({
    where: { profileId, entityType, entityId: { in: entityIds } },
  });
}

// ---- reading for visitors

export interface Lookup {
  get(type: TranslatableEntity, id: string, field: string): string | undefined;
}

export async function lookupFor(profileId: string, locale: string): Promise<Lookup> {
  const rows = await prisma.translation.findMany({
    where: { profileId, locale },
    select: { entityType: true, entityId: true, field: true, value: true },
  });
  const map = new Map(
    rows
      .filter((row) => row.value.trim())
      .map((row) => [translationKey(row.entityType, row.entityId, row.field), row.value]),
  );
  return { get: (type, id, field) => map.get(translationKey(type, id, field)) };
}

// The translation of a field, or the original when there is none (field-by-field fallback).
export const pick = <T extends string | null>(
  lookup: Lookup,
  type: TranslatableEntity,
  id: string,
  field: string,
  original: T,
): T | string => lookup.get(type, id, field) ?? original;

// The languages a visitor can choose: the extra ones whose tagline and about are translated.
export async function publishableLocales(profileId: string, locales: string[]) {
  if (locales.length === 0) return [];
  const [source, rows] = await Promise.all([
    loadSource(profileId),
    prisma.translation.findMany({ where: { profileId }, select: rowSelect }),
  ]);
  return locales.filter((locale) => statusFor(locale, source, rows).publishable);
}
