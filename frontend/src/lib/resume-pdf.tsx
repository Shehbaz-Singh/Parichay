import { Document, Link, Page, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { PublicLink, PublicProfile, ThemeKey } from '@parichay/shared';
import { buildBlocks, buildHeader, type Block, type HeaderModel } from '@/components/themes/blocks';
import { safeHttpUrl } from './format';
import './resume/fonts';
import { Avatar, BlockBody, Pill, plainUrl, rich, type BodyStyle } from './resume/parts';
import { mix, tokensFor, type Tokens } from './resume/tokens';
import { getTheme } from './themes';

// The resume PDF: the published page's own content (the same header and sections the web theme
// draws, in the owner's order, hidden and empty sections left out, only the links they show),
// laid out on paper in the look of the theme they chose, with that theme's fonts and colors.

const SIZE = 9.5;

// How a link reads on paper, and where it goes: the address itself (a label like "LinkedIn" would
// tell a reader nothing once printed).
function contactItems(links: PublicLink[]): { id: string; text: string; href: string }[] {
  return links.flatMap((link) => {
    if (link.type === 'email') return [{ id: link.id, text: link.url, href: `mailto:${link.url}` }];
    if (link.type === 'phone') {
      return [{ id: link.id, text: link.url, href: `tel:${link.url.replace(/[^\d+]/g, '')}` }];
    }
    const href = safeHttpUrl(link.url);
    return href ? [{ id: link.id, text: plainUrl(href), href }] : [];
  });
}

interface Ctx {
  header: HeaderModel;
  blocks: Block[];
  contacts: { id: string; text: string; href: string }[];
  photo: Buffer | null;
  t: Tokens;
}

const ContactLink = ({ item, color }: { item: Ctx['contacts'][number]; color: string }) => (
  <Link src={item.href} style={{ color, textDecoration: 'none' }}>
    {item.text}
  </Link>
);

// "Open to new opportunities: Looking for..." as one line of text.
const availabilityText = (header: HeaderModel) =>
  header.availability
    ? [header.availability.label, header.availability.detail].filter(Boolean).join(': ')
    : null;

const body = (t: Tokens, over: Partial<BodyStyle> = {}): BodyStyle => ({
  t,
  skills: 'pills',
  hangDates: false,
  pill: { bg: t.surface, color: t.ink, border: t.line },
  quoteBar: t.accent,
  label: t.body,
  size: SIZE,
  ...over,
});

const pageBase = (t: Tokens) => ({
  fontFamily: t.body,
  fontSize: SIZE,
  lineHeight: 1.4,
  color: t.ink,
  backgroundColor: t.bg,
});

// ---- Editorial: a masthead between two rules, small-caps labels on a hairline, hanging dates.
function Editorial({ c }: { c: Ctx }) {
  const { t, header } = c;
  const s = body(t, { skills: 'sentence', hangDates: true });
  const availability = availabilityText(header);
  return (
    <Page size="A4" style={{ ...pageBase(t), paddingVertical: 40, paddingHorizontal: 54 }}>
      <View
        style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.ink, paddingVertical: 5 }}
      >
        <Text
          style={{
            textAlign: 'center',
            fontSize: 7.5,
            fontWeight: 700,
            letterSpacing: 1.6,
            color: t.muted,
          }}
        >
          {rich((header.location ?? 'Portfolio').toUpperCase())}
        </Text>
      </View>
      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <Avatar
          photo={c.photo}
          initials={header.avatar.initials}
          size={54}
          radius={27}
          t={t}
          bg="transparent"
          color={t.ink}
          border={t.ink}
        />
        <Text
          style={{
            fontFamily: t.display,
            fontWeight: 500,
            fontSize: 38,
            marginTop: 10,
            lineHeight: 1.05,
          }}
        >
          {rich(header.name)}
        </Text>
        {header.tagline && (
          <Text
            style={{
              fontFamily: t.display,
              fontStyle: 'italic',
              fontSize: 14,
              color: t.muted,
              marginTop: 5,
              textAlign: 'center',
            }}
          >
            {rich(header.tagline)}
          </Text>
        )}
        {availability && (
          <Text
            style={{
              marginTop: 9,
              borderWidth: 0.8,
              borderColor: t.line,
              paddingHorizontal: 9,
              paddingVertical: 4,
              fontSize: 8.5,
            }}
          >
            {rich(availability)}
          </Text>
        )}
      </View>
      <View
        style={{
          marginTop: 14,
          borderTopWidth: 0.8,
          borderBottomWidth: 0.8,
          borderColor: t.line,
          paddingVertical: 7,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {c.contacts.map((item) => (
          <Text key={item.id} style={{ marginHorizontal: 7 }}>
            <ContactLink item={item} color={t.accentFg} />
          </Text>
        ))}
      </View>
      {c.blocks.map((block) => (
        <View key={block.id} style={{ marginTop: 20 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 9 }}
            minPresenceAhead={60}
          >
            <View style={{ width: 22, height: 1, backgroundColor: t.accent }} />
            <Text
              style={{ marginHorizontal: 8, fontSize: 7.5, fontWeight: 700, letterSpacing: 1.6 }}
            >
              {rich(block.title.toUpperCase())}
            </Text>
            <View style={{ flex: 1, height: 0.8, backgroundColor: t.line }} />
          </View>
          <BlockBody block={block} s={s} />
        </View>
      ))}
    </Page>
  );
}

// ---- Executive: a dark sidebar (photo, contact, skills) beside the main column.
function Executive({ c }: { c: Ctx }) {
  const { t, header } = c;
  const sideBg = mix(t.accent, '#0e1118', 0.22);
  const side = { ink: '#eef0f6', muted: '#b9c0d1', line: '#5c6170' };
  const skills = c.blocks.find((b) => b.kind === 'skills');
  const main = c.blocks.filter((b) => b.kind !== 'skills');
  const s = body(t, { skills: 'sentence' });
  const availability = availabilityText(header);
  const sideHeading = (text: string) => (
    <Text
      style={{
        fontSize: 7.5,
        fontWeight: 700,
        letterSpacing: 1.4,
        color: side.muted,
        marginTop: 16,
        marginBottom: 5,
      }}
    >
      {text.toUpperCase()}
    </Text>
  );
  return (
    <Page
      size="A4"
      style={{
        ...pageBase(t),
        paddingTop: 40,
        paddingBottom: 40,
        paddingLeft: 200,
        paddingRight: 42,
      }}
    >
      <View
        fixed
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 170,
          backgroundColor: sideBg,
        }}
      />
      <View style={{ position: 'absolute', top: 34, left: 20, width: 130 }}>
        <Avatar
          photo={c.photo}
          initials={header.avatar.initials}
          size={70}
          radius={35}
          t={t}
          bg="#3a3f4d"
          color="#ffffff"
        />
        <Text
          style={{
            fontFamily: t.display,
            fontWeight: 600,
            fontSize: 19,
            color: '#ffffff',
            marginTop: 12,
            lineHeight: 1.15,
          }}
        >
          {rich(header.name)}
        </Text>
        {header.tagline && (
          <Text style={{ color: side.muted, marginTop: 4, fontSize: 9 }}>
            {rich(header.tagline)}
          </Text>
        )}
        {availability && (
          <Text
            style={{
              color: side.ink,
              marginTop: 8,
              fontSize: 8.5,
              borderWidth: 0.8,
              borderColor: side.line,
              padding: 4,
            }}
          >
            {rich(availability)}
          </Text>
        )}
        {sideHeading('Contact')}
        {header.location && (
          <Text style={{ color: side.ink, marginBottom: 3 }}>{rich(header.location)}</Text>
        )}
        {c.contacts.map((item) => (
          <Text key={item.id} style={{ marginBottom: 3 }}>
            <ContactLink item={item} color={side.ink} />
          </Text>
        ))}
        {skills?.kind === 'skills' && (
          <>
            {sideHeading(skills.title)}
            {skills.skills.map((skill) => (
              <Text key={skill.id} style={{ color: side.ink, marginBottom: 2 }}>
                {rich(skill.name)}
              </Text>
            ))}
          </>
        )}
      </View>
      {main.map((block) => (
        <View key={block.id} style={{ marginTop: 18 }}>
          <View minPresenceAhead={60} style={{ marginBottom: 8 }}>
            <Text style={{ fontFamily: t.display, fontWeight: 600, fontSize: 14 }}>
              {rich(block.title)}
            </Text>
            <View style={{ height: 0.8, backgroundColor: t.line, marginTop: 3 }}>
              <View
                style={{ width: 34, height: 1.6, backgroundColor: t.accent, marginTop: -0.4 }}
              />
            </View>
          </View>
          <BlockBody block={block} s={s} />
        </View>
      ))}
    </Page>
  );
}

// ---- Soft: a pastel page, a white header card, and a rounded card for each section.
function Soft({ c }: { c: Ctx }) {
  const { t, header } = c;
  const tint = mix(t.accent, '#ffffff', 0.14);
  const s = body(t, { pill: { bg: tint, color: t.accentFg } });
  const availability = availabilityText(header);
  const card = {
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  };
  return (
    <Page size="A4" style={{ ...pageBase(t), padding: 34 }}>
      <View style={{ ...card, padding: 18, flexDirection: 'row' }} wrap={false}>
        <View style={{ marginRight: 14 }}>
          <Avatar
            photo={c.photo}
            initials={header.avatar.initials}
            size={62}
            radius={31}
            t={t}
            bg={tint}
            color={t.accentFg}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: t.display, fontWeight: 700, fontSize: 25, lineHeight: 1.1 }}>
            {rich(header.name)}
          </Text>
          {header.tagline && (
            <Text style={{ color: t.muted, marginTop: 3, fontSize: 11 }}>
              {rich(header.tagline)}
            </Text>
          )}
          {header.location && (
            <Text style={{ color: t.muted, marginTop: 3 }}>{rich(header.location)}</Text>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {availability && (
              <Pill t={t} bg={tint} color={t.ink}>
                {rich(availability)}
              </Pill>
            )}
            {c.contacts.map((item) => (
              <Pill key={item.id} t={t} border={t.line} color={t.accentFg}>
                <ContactLink item={item} color={t.accentFg} />
              </Pill>
            ))}
          </View>
        </View>
      </View>
      {c.blocks.map((block) => (
        <View key={block.id} style={card}>
          <Text
            minPresenceAhead={50}
            style={{
              fontFamily: t.display,
              fontWeight: 700,
              fontSize: 13,
              color: t.accentFg,
              marginBottom: 7,
            }}
          >
            {rich(block.title)}
          </Text>
          <BlockBody block={block} s={s} />
        </View>
      ))}
    </Page>
  );
}

// ---- Bento: an accent tile for the header, then tiles tinted from the accent.
function Bento({ c }: { c: Ctx }) {
  const { t, header } = c;
  const tile = {
    backgroundColor: mix(t.accent, '#ffffff', 0.06),
    borderWidth: 1,
    borderColor: mix(t.accent, '#e4e6ee', 0.16),
    borderRadius: 12,
    padding: 13,
    marginBottom: 9,
  };
  const s = body(t, { pill: { bg: '#ffffff', color: t.ink, border: t.line } });
  const availability = availabilityText(header);
  return (
    <Page size="A4" style={{ ...pageBase(t), padding: 32 }}>
      <View
        style={{
          backgroundColor: t.accent,
          borderRadius: 14,
          padding: 20,
          marginBottom: 9,
          flexDirection: 'row',
        }}
        wrap={false}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: t.display,
              fontWeight: 700,
              fontSize: 26,
              color: t.onAccent,
              lineHeight: 1.1,
            }}
          >
            {rich(header.name)}
          </Text>
          {header.tagline && (
            <Text style={{ color: t.onAccent, marginTop: 4, fontSize: 11 }}>
              {rich(header.tagline)}
            </Text>
          )}
          {header.location && (
            <Text style={{ color: t.onAccent, marginTop: 3 }}>{rich(header.location)}</Text>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            {availability && (
              <Pill t={t} bg={t.onAccent} color={t.accentFg}>
                {rich(availability)}
              </Pill>
            )}
            {c.contacts.map((item) => (
              <Pill key={item.id} t={t} border={t.onAccent} color={t.onAccent}>
                <ContactLink item={item} color={t.onAccent} />
              </Pill>
            ))}
          </View>
        </View>
        <Avatar
          photo={c.photo}
          initials={header.avatar.initials}
          size={64}
          radius={14}
          t={t}
          bg={t.onAccent}
          color={t.accentFg}
        />
      </View>
      {c.blocks.map((block) => (
        <View key={block.id} style={tile}>
          <Text
            minPresenceAhead={50}
            style={{
              fontFamily: t.display,
              fontWeight: 700,
              fontSize: 8,
              letterSpacing: 1.2,
              color: t.accentFg,
              marginBottom: 7,
            }}
          >
            {rich(block.title.toUpperCase())}
          </Text>
          <BlockBody block={block} s={s} />
        </View>
      ))}
    </Page>
  );
}

// ---- Creative: a colored header band with a big name, and numbered sections.
function Creative({ c }: { c: Ctx }) {
  const { t, header } = c;
  const mono = t.mono ?? t.body;
  const s = body(t, { label: mono, pill: { bg: t.surface, color: t.ink, border: t.ink } });
  const availability = availabilityText(header);
  return (
    <Page size="A4" style={{ ...pageBase(t), paddingBottom: 38 }}>
      <View
        style={{
          backgroundColor: t.accent,
          paddingHorizontal: 42,
          paddingTop: 36,
          paddingBottom: 30,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        wrap={false}
      >
        <View style={{ flex: 1, paddingRight: 14 }}>
          {header.location && (
            <Text
              style={{
                fontFamily: mono,
                fontSize: 8,
                color: t.onAccent,
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              {rich(header.location.toUpperCase())}
            </Text>
          )}
          <Text
            style={{
              fontFamily: t.display,
              fontWeight: 800,
              fontSize: 40,
              color: t.onAccent,
              lineHeight: 1,
            }}
          >
            {rich(header.name)}
          </Text>
          {header.tagline && (
            <Text style={{ color: t.onAccent, fontSize: 12, marginTop: 7 }}>
              {rich(header.tagline)}
            </Text>
          )}
          {availability && (
            <Text style={{ color: t.onAccent, fontFamily: mono, fontSize: 8, marginTop: 8 }}>
              {rich(availability)}
            </Text>
          )}
          <Text style={{ marginTop: 8, fontSize: 9 }}>
            {c.contacts.map((item, i) => (
              <Text key={item.id}>
                {i > 0 ? '   ' : ''}
                <ContactLink item={item} color={t.onAccent} />
              </Text>
            ))}
          </Text>
        </View>
        <Avatar
          photo={c.photo}
          initials={header.avatar.initials}
          size={74}
          radius={14}
          t={t}
          bg="#ffffff"
          color={t.accentFg}
        />
      </View>
      <View style={{ paddingHorizontal: 42 }}>
        {c.blocks.map((block, i) => (
          <View key={block.id} style={{ marginTop: 22 }}>
            <View
              minPresenceAhead={60}
              style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}
            >
              <Text style={{ fontFamily: mono, fontSize: 9, color: t.accentFg, width: 26 }}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text style={{ fontFamily: t.display, fontWeight: 800, fontSize: 16 }}>
                {rich(block.title)}
              </Text>
            </View>
            <View style={{ paddingLeft: 26 }}>
              <BlockBody block={block} s={s} />
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
}

const LAYOUTS: Record<ThemeKey, (props: { c: Ctx }) => ReactNode> = {
  editorial: Editorial,
  executive: Executive,
  soft: Soft,
  bento: Bento,
  creative: Creative,
};

// `photo` is the profile photo as JPEG bytes, or null (initials are drawn instead).
export function ResumeDocument({
  profile,
  photo = null,
}: {
  profile: PublicProfile;
  photo?: Buffer | null;
}) {
  const theme = getTheme(profile.theme).key;
  const Layout = LAYOUTS[theme];
  const ctx: Ctx = {
    header: buildHeader(profile),
    blocks: buildBlocks(profile, '', 'complete'),
    contacts: contactItems(profile.links),
    photo,
    t: tokensFor(theme, profile.accentColor),
  };
  return (
    <Document
      title={`${profile.fullName} - Resume`}
      author={profile.fullName}
      subject={profile.tagline ?? 'Resume'}
      creator="Parichay"
      producer="Parichay"
      language="en-IN"
    >
      <Layout c={ctx} />
    </Document>
  );
}
