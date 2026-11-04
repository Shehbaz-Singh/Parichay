import type { AvailabilityStatus } from './availability';
import type { LinkType, ThemeKey } from './portfolio';
import type { SectionKey } from './section-config';

// The five sample profiles: made-up people with made-up employers and colleges, used to show what
// a page looks like (the landing page and the seed script both read this one list). Nothing here
// is a real person or organization. Links go to example.com, which is reserved for examples, so
// none of them points at a real account. Their avatars are initials, never photos.

export interface SampleProfile {
  slug: string;
  fullName: string;
  tagline: string;
  about: string;
  location: string;
  theme: ThemeKey;
  accentColor: string;
  // The sections shown, in order. `custom:N` is the Nth entry of `custom`. Everything else is hidden.
  sections: (SectionKey | `custom:${number}`)[];
  availability?: { status: AvailabilityStatus; message: string };
  links: { type: LinkType; url: string }[];
  skills: string[];
  experience: {
    title: string;
    company: string;
    start: string; // YYYY-MM-DD
    end: string | null;
    description: string;
  }[];
  projects: { name: string; url: string | null; description: string; techTags: string[] }[];
  education: { degree: string; institution: string; start: string; end: string | null }[];
  custom: {
    title: string;
    items: {
      title: string;
      subtitle?: string;
      start?: string;
      end?: string;
      url?: string;
      description?: string;
    }[];
  }[];
  testimonials: {
    authorName: string;
    authorRole: string;
    authorCompany: string;
    message: string;
  }[];
  posts: {
    title: string;
    slug: string;
    type: 'post' | 'link';
    excerpt: string;
    externalUrl?: string;
    body?: string;
    publishedAt: string; // ISO
  }[];
}

export const SAMPLE_PROFILES: SampleProfile[] = [
  {
    slug: 'tanisha-walia',
    fullName: 'Tanisha Walia',
    tagline: 'Product designer who likes small, clear flows',
    about:
      'I am a product designer in New Delhi with three years of experience on web and mobile products. I enjoy the unglamorous parts of design: forms, empty states and the words on a button. I work closely with developers and like to test an idea with a few real users before polishing it.',
    location: 'New Delhi, India',
    theme: 'editorial',
    accentColor: '#9d174d',
    sections: ['about', 'experience', 'projects', 'skills', 'writing'],
    availability: {
      status: 'open_to_work',
      message: 'Looking for product design roles in Delhi NCR, or remote.',
    },
    links: [
      { type: 'website', url: 'https://example.com/tanisha-walia' },
      { type: 'linkedin', url: 'https://example.com/tanisha-walia/linkedin' },
      { type: 'email', url: 'tanisha@example.com' },
    ],
    skills: [
      'Product design',
      'User research',
      'Prototyping',
      'Design systems',
      'Figma',
      'Accessibility',
    ],
    experience: [
      {
        title: 'Product Designer',
        company: 'Paperboat Design Co.',
        start: '2023-02-01',
        end: null,
        description:
          'Design web and mobile features for two client products, from first sketches to hand-off. Run short usability sessions with five or six people before each release.',
      },
      {
        title: 'Design Intern',
        company: 'Fieldnote Studio',
        start: '2022-06-01',
        end: '2023-01-31',
        description:
          'Redrew screens for a booking app and wrote the first set of its UI guidelines.',
      },
    ],
    projects: [
      {
        name: 'Reorder flow for a grocery app',
        url: null,
        description:
          'Problem: shoppers who buy the same things weekly had to search for each item again. What I did: interviewed six regular shoppers, then designed a “buy again” list with one-tap quantities. Result: in testing, a repeat basket took 4 steps instead of 9.',
        techTags: ['Research', 'Mobile', 'Prototype'],
      },
      {
        name: 'Clinic appointment booking',
        url: null,
        description:
          'Problem: patients often gave up halfway through a long booking form. What I did: cut the form to what the front desk needs first, and moved the rest to a follow-up message. Result: five of six testers finished without help, up from three.',
        techTags: ['Forms', 'Web', 'Accessibility'],
      },
      {
        name: 'Design system clean-up',
        url: null,
        description:
          'Problem: a product had nine slightly different greys and four button styles. What I did: audited every screen, agreed on one set of colors and components with the developers, and documented them.',
        techTags: ['Design system', 'Figma'],
      },
    ],
    education: [
      {
        degree: 'B.Des in Communication Design',
        institution: 'Metro College of Design',
        start: '2019-08-01',
        end: '2023-05-31',
      },
    ],
    custom: [],
    testimonials: [],
    posts: [
      {
        title: 'Giving design critique that helps',
        slug: 'giving-design-critique-that-helps',
        type: 'post',
        excerpt:
          'Four habits that make a critique useful to the person receiving it, and easy to act on.',
        publishedAt: '2026-09-14T09:00:00.000Z',
        body: `Most of the critique I have received was well meant and not very useful. These are the habits that made the useful kind different.

## Say what you see before what you think

“The button is grey and sits below the fold” is something the designer can check. “This feels off” is not. Start with what you observe, then say what you think it causes.

## Ask what the work is meant to do

A screen can be handsome and still fail at its job. Before giving an opinion, ask: *who is this for, and what should they be able to do?*

## Keep it to a few points

Five comments that matter beat twenty that do not. If you have many, sort them and share the top three.

## Offer a direction, not an order

“Could the price be closer to the button?” leaves room for the designer to find an answer. “Move the price” does not.

Critique is a conversation. If both people leave knowing what to try next, it did its job.`,
      },
    ],
  },
  {
    slug: 'ayush-gill',
    fullName: 'Ayush Gill',
    tagline: 'Full-stack developer building tools for small businesses',
    about:
      'I am a full-stack developer in Ludhiana with three years of experience. I build web apps with TypeScript, React, Node.js and PostgreSQL, mostly for small businesses that want to move off paper and spreadsheets. I like simple designs that are easy to keep running.',
    location: 'Ludhiana, India',
    theme: 'bento',
    accentColor: '#0f766e',
    sections: ['about', 'experience', 'projects', 'skills', 'education', 'custom:0'],
    links: [
      { type: 'github', url: 'https://example.com/ayush-gill/github' },
      { type: 'linkedin', url: 'https://example.com/ayush-gill/linkedin' },
      { type: 'website', url: 'https://example.com/ayush-gill' },
      { type: 'email', url: 'ayush@example.com' },
    ],
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS', 'Docker'],
    experience: [
      {
        title: 'Software Developer',
        company: 'Brightleaf Software',
        start: '2023-06-01',
        end: null,
        description:
          'Build and maintain an order-tracking web app used by about forty dealers. Moved its reports from manual spreadsheets to a weekly email.',
      },
      {
        title: 'Junior Developer',
        company: 'Paperboat Digital',
        start: '2022-01-01',
        end: '2023-05-31',
        description: 'Built landing pages and small admin tools for local clients.',
      },
    ],
    projects: [
      {
        name: 'Hisaab Khata',
        url: 'https://example.com/ayush-gill/hisaab-khata',
        description:
          'A simple ledger for shopkeepers to track what customers owe, with reminders by message and a printable statement.',
        techTags: ['Next.js', 'Express', 'PostgreSQL', 'Prisma'],
      },
      {
        name: 'Bus Pass Tracker',
        url: 'https://example.com/ayush-gill/bus-pass',
        description:
          'Helps a small transport company see which monthly passes expire this week. Built for the office staff, who use it on a shared computer.',
        techTags: ['React', 'Node.js', 'SQLite'],
      },
      {
        name: 'mdnotes',
        url: 'https://example.com/ayush-gill/mdnotes',
        description:
          'A command-line tool that turns a folder of Markdown notes into a searchable page.',
        techTags: ['TypeScript', 'CLI'],
      },
    ],
    education: [
      {
        degree: 'B.Tech in Computer Science',
        institution: 'City Institute of Technology',
        start: '2018-08-01',
        end: '2022-05-31',
      },
    ],
    custom: [
      {
        title: 'Open source',
        items: [
          {
            title: 'Small fixes to a form-validation library',
            subtitle: 'Contributor',
            start: '2024-03-01',
            url: 'https://example.com/ayush-gill/form-library',
            description:
              'Corrected error messages and added a Punjabi-language example to the docs.',
          },
          {
            title: 'Maintainer of mdnotes',
            subtitle: 'Personal project',
            start: '2025-01-01',
            description: 'Reviewing issues and releasing fixes. Eleven contributors so far.',
          },
        ],
      },
    ],
    testimonials: [],
    posts: [],
  },
  {
    slug: 'navjot-singh',
    fullName: 'Navjot Singh',
    tagline: 'Photographer and filmmaker telling quiet stories about places',
    about:
      'I am a photographer and filmmaker in Amritsar. I shoot street photography, short documentaries and the occasional wedding. Most of my work is about the people and routines of old city neighborhoods, in the light of early morning and late afternoon.',
    location: 'Amritsar, India',
    theme: 'creative',
    accentColor: '#c2410c',
    sections: ['about', 'projects', 'skills', 'custom:0', 'writing'],
    links: [
      { type: 'website', url: 'https://example.com/navjot-singh' },
      { type: 'other', url: 'https://example.com/navjot-singh/films' },
      { type: 'email', url: 'navjot@example.com' },
    ],
    skills: [
      'Street photography',
      'Documentary film',
      'Color grading',
      'Sound recording',
      'Lightroom',
      'DaVinci Resolve',
    ],
    experience: [],
    projects: [
      {
        name: 'Walled City at Dawn',
        url: 'https://example.com/navjot-singh/walled-city',
        description:
          'A series of 24 photographs taken over one winter between five and seven in the morning: bakers, milkmen and the lanes before the shops open.',
        techTags: ['Photography', 'Street', 'Series'],
      },
      {
        name: 'Harvest',
        url: 'https://example.com/navjot-singh/harvest',
        description:
          'A 14-minute documentary following one family through the wheat harvest. Shot alone over three weeks on a small camera and a borrowed microphone.',
        techTags: ['Documentary', 'Film', 'Sound'],
      },
      {
        name: 'Wedding stories',
        url: null,
        description:
          'Short films of two to four minutes for couples who want something quieter than a long album.',
        techTags: ['Film', 'Events'],
      },
    ],
    education: [],
    custom: [
      {
        title: 'Awards',
        items: [
          {
            title: 'Third place, Open Photography Contest',
            subtitle: 'Punjab Photo Circle',
            start: '2023-11-01',
            description: 'For one photograph from Walled City at Dawn.',
          },
          {
            title: 'Official selection, Independent Short Film Evenings',
            subtitle: 'Amritsar',
            start: '2025-02-01',
            description: 'Harvest was screened in the documentary program.',
          },
        ],
      },
    ],
    testimonials: [],
    posts: [
      {
        title: 'Shooting the old city in the first hour of light',
        slug: 'shooting-the-old-city-first-light',
        type: 'link',
        excerpt:
          'Notes on planning a morning shoot in narrow lanes: where the light falls, and how to stay out of the way.',
        externalUrl: 'https://example.com/navjot-singh/first-light',
        publishedAt: '2026-06-02T07:00:00.000Z',
      },
    ],
  },
  {
    slug: 'sameer-bhatia',
    fullName: 'Sameer Bhatia',
    tagline: 'Data analyst who turns messy spreadsheets into clear dashboards',
    about:
      'I am a data analyst in Mumbai. I work with operations data: deliveries, stock and costs. My job is to find out what the numbers say and to show it in a way a busy manager can use in five minutes. I prefer a plain chart that is right over a fancy one that is not.',
    location: 'Mumbai, India',
    theme: 'executive',
    accentColor: '#1d4ed8',
    sections: [
      'about',
      'experience',
      'projects',
      'skills',
      'education',
      'custom:0',
      'testimonials',
    ],
    links: [
      { type: 'linkedin', url: 'https://example.com/sameer-bhatia/linkedin' },
      { type: 'website', url: 'https://example.com/sameer-bhatia' },
      { type: 'email', url: 'sameer@example.com' },
    ],
    skills: ['SQL', 'Python', 'Excel', 'Power BI', 'Statistics', 'Data cleaning'],
    experience: [
      {
        title: 'Data Analyst',
        company: 'Lakeview Logistics',
        start: '2022-08-01',
        end: null,
        description:
          'Build the weekly reports used by the operations team and look into delays when they spike. Replaced a manual Monday spreadsheet with a dashboard that refreshes itself.',
      },
      {
        title: 'Business Intelligence Intern',
        company: 'Kestrel Insights',
        start: '2021-12-01',
        end: '2022-06-30',
        description: 'Cleaned survey data and prepared charts for client presentations.',
      },
    ],
    projects: [
      {
        name: 'Delivery delays dashboard',
        url: null,
        description:
          'Shows late deliveries by route, day and driver shift, with a note on likely causes. The operations team uses it in their Monday meeting.',
        techTags: ['Power BI', 'SQL'],
      },
      {
        name: 'Monthly cost review',
        url: null,
        description:
          'A one-page report comparing fuel, maintenance and overtime against the previous three months.',
        techTags: ['Excel', 'Python'],
      },
      {
        name: 'Customer churn exploration',
        url: null,
        description:
          'A practice analysis of a public telecom dataset: which customers leave, and what they have in common.',
        techTags: ['Python', 'pandas', 'Statistics'],
      },
    ],
    education: [
      {
        degree: 'B.Sc. in Statistics',
        institution: 'Metro College of Science',
        start: '2018-07-01',
        end: '2021-05-31',
      },
    ],
    custom: [
      {
        title: 'Certifications',
        items: [
          {
            title: 'Data Analysis with SQL',
            subtitle: 'Open Learning Hub',
            start: '2021-09-01',
            description: 'Course certificate.',
          },
          {
            title: 'Statistics for Analysts',
            subtitle: 'Open Learning Hub',
            start: '2022-03-01',
            description: 'Course certificate.',
          },
        ],
      },
    ],
    testimonials: [
      {
        authorName: 'Meera Kapoor',
        authorRole: 'Operations Lead',
        authorCompany: 'Lakeview Logistics',
        message:
          'Sameer’s dashboard changed our Monday meetings. We stopped arguing about whose spreadsheet was right and started talking about what to fix.',
      },
    ],
    posts: [],
  },
  {
    slug: 'syed-abraar',
    fullName: 'Syed Abraar',
    tagline: 'Final-year computer science student learning by building',
    about:
      'I am in my final year of B.Tech in Computer Science in Hyderabad. I enjoy backend work and small web apps, and I learn best by building something I will actually use. I finished a summer internship this year and I am now looking for my first full-time developer role.',
    location: 'Hyderabad, India',
    theme: 'soft',
    accentColor: '#15803d',
    sections: ['about', 'education', 'skills', 'experience', 'projects'],
    availability: {
      status: 'custom',
      message: 'Looking for my first job as a software developer, starting mid-2027.',
    },
    links: [
      { type: 'github', url: 'https://example.com/syed-abraar/github' },
      { type: 'linkedin', url: 'https://example.com/syed-abraar/linkedin' },
      { type: 'email', url: 'syed@example.com' },
    ],
    skills: ['Java', 'Python', 'React', 'SQL', 'Git', 'Data structures'],
    experience: [
      {
        title: 'Summer Intern',
        company: 'Fieldnote Studio',
        start: '2026-05-01',
        end: '2026-07-31',
        description:
          'Helped build internal admin screens in React and fixed a dozen small bugs under the guidance of a senior developer.',
      },
    ],
    projects: [
      {
        name: 'Campus Notes',
        url: 'https://example.com/syed-abraar/campus-notes',
        description:
          'A small web app where students in my department share lecture notes by subject. About sixty classmates have used it.',
        techTags: ['React', 'Node.js', 'PostgreSQL'],
      },
      {
        name: 'Quiz Buzzer',
        url: null,
        description: 'A classroom quiz game that runs in the browser, built for a college fest.',
        techTags: ['JavaScript', 'WebSockets'],
      },
    ],
    education: [
      {
        degree: 'B.Tech in Computer Science and Engineering',
        institution: 'Deccan Institute of Technology',
        start: '2023-08-01',
        end: '2027-05-31',
      },
      {
        degree: 'Senior Secondary, Science stream',
        institution: 'Sunrise Junior College',
        start: '2021-06-01',
        end: '2023-03-31',
      },
    ],
    custom: [],
    testimonials: [],
    posts: [],
  },
];

// The email each sample account is stored under. The domain is reserved (.invalid never resolves),
// and the password is random and thrown away, so nobody can sign in as a sample.
export const sampleEmail = (slug: string) => `${slug}@sample.parichay.invalid`;
