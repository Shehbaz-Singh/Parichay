import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import {
  SAMPLE_PROFILES,
  SAMPLE_SLUGS,
  SECTION_KEYS,
  customKey,
  sampleEmail,
  type SampleProfile,
} from '@parichay/shared';
import { prisma } from '../src/lib/prisma';
import { slugifyTitle } from '../src/lib/slug';

// Seeds the five sample profiles (shared/src/samples.ts): made-up people, published, flagged
// isSample. Safe to run again: each run replaces the samples' own rows and touches nothing else.
// No one can sign in as a sample: the accounts use a reserved email domain and a random password
// that is hashed and never shown or stored anywhere.

// The demo account an earlier version of this script created.
const OLD_SAMPLE_EMAIL = 'demo@example.com';
const OLD_SAMPLE_SLUG = 'jane-doe';

const date = (iso: string) => new Date(iso);

async function removeOldSample() {
  const user = await prisma.user.findUnique({
    where: { email: OLD_SAMPLE_EMAIL },
    select: { id: true, profile: { select: { slug: true } } },
  });
  if (!user) return;
  // Only the account that is certainly the old sample: no profile, or the old sample's address.
  if (user.profile && user.profile.slug !== OLD_SAMPLE_SLUG) {
    console.warn(`Left ${OLD_SAMPLE_EMAIL} alone: it has a profile at /${user.profile.slug}.`);
    return;
  }
  await prisma.user.delete({ where: { id: user.id } }); // the profile and its rows cascade
  console.log(`Removed the old sample ${OLD_SAMPLE_EMAIL}`);
}

async function seedOne(sample: SampleProfile) {
  const { slug } = sample;
  if (!(SAMPLE_SLUGS as readonly string[]).includes(slug)) {
    throw new Error(`${slug} is missing from SAMPLE_SLUGS (shared/src/portfolio.ts)`);
  }

  // Never overwrite a real person's page that happens to hold the address.
  const holder = await prisma.profile.findUnique({
    where: { slug },
    select: { isSample: true },
  });
  if (holder && !holder.isSample) {
    throw new Error(`/${slug} belongs to a real profile. Rename or remove it, then seed again.`);
  }

  const email = sampleEmail(slug);
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
  // A fresh random password each run: it was never known to anyone.
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
  await prisma.profile.deleteMany({ where: { userId: user.id } }); // its rows cascade

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      slug,
      fullName: sample.fullName,
      tagline: sample.tagline,
      about: sample.about,
      location: sample.location,
      avatarUrl: null, // initials, never a photo
      theme: sample.theme,
      accentColor: sample.accentColor,
      published: true,
      isSample: true,
      acceptTestimonials: false,
      availabilityEnabled: !!sample.availability,
      availabilityStatus: sample.availability?.status ?? 'open_to_work',
      availabilityMessage: sample.availability?.message ?? null,
      links: {
        create: sample.links.map((link, order) => ({ ...link, visible: true, order })),
      },
      skills: { create: sample.skills.map((name, order) => ({ name, order })) },
      experience: {
        create: sample.experience.map((job, order) => ({
          title: job.title,
          company: job.company,
          startDate: date(job.start),
          endDate: job.end ? date(job.end) : null,
          description: job.description,
          order,
        })),
      },
      projects: {
        create: sample.projects.map((project, order) => ({
          ...project,
          slug: `${slugifyTitle(project.name)}-${order + 1}`,
          order,
        })),
      },
      education: {
        create: sample.education.map((item, order) => ({
          degree: item.degree,
          institution: item.institution,
          startDate: date(item.start),
          endDate: item.end ? date(item.end) : null,
          order,
        })),
      },
      customSections: {
        create: sample.custom.map((section, order) => ({
          title: section.title,
          order,
          visible: true,
          items: {
            create: section.items.map((item, itemOrder) => ({
              title: item.title,
              subtitle: item.subtitle ?? null,
              startDate: item.start ? date(item.start) : null,
              endDate: item.end ? date(item.end) : null,
              url: item.url ?? null,
              description: item.description ?? null,
              order: itemOrder,
            })),
          },
        })),
      },
      testimonials: {
        create: sample.testimonials.map((item, order) => ({
          ...item,
          contactEmail: null,
          status: 'approved' as const,
          order,
        })),
      },
      posts: {
        create: sample.posts.map((post) => ({
          title: post.title,
          slug: post.slug,
          type: post.type,
          excerpt: post.excerpt,
          body: post.body ?? null,
          externalUrl: post.externalUrl ?? null,
          status: 'published' as const,
          publishedAt: date(post.publishedAt),
        })),
      },
    },
    select: { id: true, customSections: { select: { id: true }, orderBy: { order: 'asc' } } },
  });

  // The page layout: the listed sections in order, then everything else hidden.
  const keyOf = (entry: string) =>
    entry.startsWith('custom:')
      ? customKey(profile.customSections[Number(entry.slice('custom:'.length))].id)
      : entry;
  const shown = sample.sections.map(keyOf);
  const hidden = [
    ...SECTION_KEYS.filter((key) => !shown.includes(key)),
    ...profile.customSections
      .map((section) => customKey(section.id))
      .filter((key) => !shown.includes(key)),
  ];
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      sectionConfig: [
        ...shown.map((key) => ({ key, visible: true })),
        ...hidden.map((key) => ({ key, visible: false })),
      ],
    },
  });
  // Custom sections mirror their place in the layout.
  await Promise.all(
    profile.customSections.map((section) =>
      prisma.customSection.update({
        where: { id: section.id },
        data: {
          order: shown.indexOf(customKey(section.id)),
          visible: shown.includes(customKey(section.id)),
        },
      }),
    ),
  );

  console.log(`Seeded /${slug} (${sample.theme})`);
}

async function main() {
  await removeOldSample();
  for (const sample of SAMPLE_PROFILES) await seedOne(sample);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
