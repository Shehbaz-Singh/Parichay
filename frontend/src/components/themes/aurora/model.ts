import type { PublicProfile } from '@parichay/shared';
import { translatorFor } from '@/lib/i18n';
import type { HeaderModel } from '../blocks';
import { experienceYears } from '../sidebar/model';
import type { BentoModel } from './parts';

// What the At a glance block shows, from the profile only: the role, where, availability, the years worked
// (computed from the dates), the first skills and the working-together card. `skills` is where the rest is.
export function bentoModel(
  profile: PublicProfile,
  header: HeaderModel,
  links: { skills: string | null },
): BentoModel {
  const ui = header.ui;
  const visible = (key: string) => profile.sections.some((section) => section.key === key);
  const years = visible('experience') ? experienceYears(profile) : null;
  const skills = visible('skills') ? profile.skills.slice(0, 8).map((skill) => skill.name) : [];
  return {
    header,
    heading: ui.sidebar.statsLabel,
    skills:
      skills.length > 0
        ? {
            names: skills,
            total: profile.skills.length,
            href: links.skills,
            label: ui.aurora.allSkills,
          }
        : null,
    experience: years ? translatorFor(profile.locale)('years', { count: years }) : null,
  };
}
