import { Image, Link, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { Block, Entry } from '@/components/themes/blocks';
import { SITE_URL } from '../config';
import { parseDescription } from '../description';
import { formatDate, formatRange } from '../format';
import { DEVANAGARI } from './fonts';
import type { Tokens } from './tokens';

// The pieces every theme's resume layout shares: text that can hold Hindi, avatars, pills and the
// body of each kind of section (the same Block the web themes draw, so the PDF says what the page says).

const isDevanagari = (char: string) => {
  const code = char.codePointAt(0) ?? 0;
  return (code >= 0x900 && code <= 0x97f) || code === 0x200c || code === 0x200d;
};

// Text with Devanagari runs set in the Devanagari face, so Hindi, Punjabi names and the like get
// the right shaping and weight next to Latin text in any theme's font.
export function rich(text: string): ReactNode[] {
  const runs: { dev: boolean; text: string }[] = [];
  const chars = Array.from(text);
  chars.forEach((char, i) => {
    const space = char === ' ' || char === String.fromCharCode(0xa0);
    const last = runs[runs.length - 1];
    // A space stays inside a Devanagari run only when Devanagari follows it.
    const dev =
      isDevanagari(char) || (space && last?.dev === true && isDevanagari(chars[i + 1] ?? ''));
    if (last && last.dev === dev) last.text += char;
    else runs.push({ dev, text: char });
  });
  return runs.map((run, i) =>
    run.dev ? (
      <Text key={i} style={{ fontFamily: DEVANAGARI }}>
        {run.text}
      </Text>
    ) : (
      run.text
    ),
  );
}

// "https://github.com/jane/" -> "github.com/jane"
export const plainUrl = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '');

// A page's own links are relative ("/jane/writing/post"): on paper they need the whole address.
export const absolute = (href: string) => (href.startsWith('/') ? `${SITE_URL}${href}` : href);

export function Paragraphs({ text, style }: { text: string | null | undefined; style?: object }) {
  // The same reading as the web page: list markers become bullets, blank lines split paragraphs.
  const parts = parseDescription(text ?? '');
  return (
    <>
      {parts.flatMap((part, i) =>
        part.kind === 'p'
          ? [
              <Text key={i} style={{ marginTop: i === 0 ? 0 : 3, ...style }}>
                {rich(part.text)}
              </Text>,
            ]
          : part.items.map((item, j) => (
              <View
                key={`${i}-${j}`}
                style={{ flexDirection: 'row', marginTop: i === 0 && j === 0 ? 0 : 2 }}
              >
                <Text style={{ width: 10, ...style }}>{'•'}</Text>
                <Text style={{ flex: 1, ...style }}>{rich(item)}</Text>
              </View>
            )),
      )}
    </>
  );
}

// The initials in a circle (or a rounded square), or the photo when there is one.
export function Avatar({
  photo,
  initials,
  size,
  radius,
  t,
  bg,
  color,
  border,
}: {
  photo: Buffer | null;
  initials: string;
  size: number;
  radius: number;
  t: Tokens;
  bg: string;
  color: string;
  border?: string;
}) {
  if (photo) {
    return (
      <Image
        src={{ data: photo, format: 'jpg' }}
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover' }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bg,
        borderWidth: border ? 1 : 0,
        borderColor: border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: t.display, fontWeight: 700, fontSize: size * 0.36, color }}>
        {initials}
      </Text>
    </View>
  );
}

export function Pill({
  children,
  t,
  bg,
  color,
  border,
  size = 8.5,
}: {
  children: ReactNode;
  t: Tokens;
  bg?: string;
  color: string;
  border?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        backgroundColor: bg,
        borderWidth: border ? 0.8 : 0,
        borderColor: border,
        borderRadius: 20,
        paddingHorizontal: 7,
        paddingVertical: 2.5,
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      <Text style={{ fontFamily: t.body, fontSize: size, color }}>{children}</Text>
    </View>
  );
}

const dateText = (entry: Entry, openEnded: boolean) => {
  if (!entry.start) return '';
  const range = formatRange(entry.start, entry.end, openEnded);
  return entry.duration ? `${range} · ${entry.duration}` : range;
};

// How a layout shows the content of each kind of section.
export interface BodyStyle {
  t: Tokens;
  skills: 'sentence' | 'pills' | 'list';
  hangDates: boolean; // dates in a left column beside each entry
  pill: { bg?: string; color: string; border?: string };
  quoteBar: string; // the rule beside a testimonial
  label: string; // the font of dates and other small labels
  size: number;
}

function EntryView({ entry, openEnded, s }: { entry: Entry; openEnded: boolean; s: BodyStyle }) {
  const { t } = s;
  const when = dateText(entry, openEnded);
  const main = (
    <View style={s.hangDates ? { flex: 1 } : {}}>
      <Text
        style={{ fontFamily: t.display, fontWeight: 700, fontSize: s.size + 1.5, color: t.ink }}
      >
        {rich(entry.title)}
      </Text>
      {entry.subtitle && (
        <Text style={{ color: t.muted, marginTop: 1 }}>{rich(entry.subtitle)}</Text>
      )}
      {entry.roles?.map((role) => (
        <View key={role.id} style={{ marginTop: 5 }} wrap={false}>
          <Text style={{ fontWeight: 700 }}>
            {rich(role.title)}
            {role.start ? `  ${formatRange(role.start, role.end, openEnded)}` : ''}
          </Text>
          <Paragraphs text={role.description} style={{ marginTop: 1 }} />
        </View>
      ))}
      {entry.description && <Paragraphs text={entry.description} style={{ marginTop: 3 }} />}
      {entry.href && (
        <Link
          src={entry.href}
          style={{ color: t.accentFg, textDecoration: 'none', marginTop: 2, fontSize: s.size - 1 }}
        >
          {plainUrl(entry.href)}
        </Link>
      )}
    </View>
  );
  if (s.hangDates) {
    return (
      <View style={{ flexDirection: 'row', marginBottom: 9 }} wrap={false}>
        <Text
          style={{
            width: 92,
            paddingRight: 8,
            color: t.muted,
            fontFamily: s.label,
            fontSize: s.size - 1,
          }}
        >
          {when}
        </Text>
        {main}
      </View>
    );
  }
  return (
    <View style={{ marginBottom: 9 }} wrap={false}>
      {when ? (
        <Text
          style={{ color: t.muted, fontFamily: s.label, fontSize: s.size - 1, marginBottom: 1 }}
        >
          {when}
        </Text>
      ) : null}
      {main}
    </View>
  );
}

export function BlockBody({ block, s }: { block: Block; s: BodyStyle }) {
  const { t } = s;
  switch (block.kind) {
    case 'about':
      return <Paragraphs text={block.text} />;
    case 'skills':
      if (s.skills === 'sentence') {
        return <Text>{rich(block.skills.map((skill) => skill.name).join(', ') + '.')}</Text>;
      }
      if (s.skills === 'list') {
        return (
          <View>
            {block.skills.map((skill) => (
              <Text key={skill.id} style={{ marginBottom: 2 }}>
                {rich(skill.name)}
              </Text>
            ))}
          </View>
        );
      }
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {block.skills.map((skill) => (
            <Pill key={skill.id} t={t} {...s.pill} size={s.size - 0.5}>
              {rich(skill.name)}
            </Pill>
          ))}
        </View>
      );
    case 'projects':
      return (
        <View>
          {block.projects.map((project) => (
            <View key={project.id} style={{ marginBottom: 9 }} wrap={false}>
              <Text
                style={{
                  fontFamily: t.display,
                  fontWeight: 700,
                  fontSize: s.size + 1.5,
                  color: t.ink,
                }}
              >
                {rich(project.name)}
              </Text>
              {project.href && (
                <Link
                  src={project.href}
                  style={{ color: t.accentFg, textDecoration: 'none', fontSize: s.size - 1 }}
                >
                  {plainUrl(project.href)}
                </Link>
              )}
              {project.description && (
                <Paragraphs text={project.description} style={{ marginTop: 2 }} />
              )}
              {project.tags.length > 0 &&
                (s.skills === 'pills' ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                    {project.tags.map((tag) => (
                      <Pill key={tag} t={t} {...s.pill} size={s.size - 1}>
                        {rich(tag)}
                      </Pill>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: t.muted, marginTop: 3, fontFamily: s.label }}>
                    {rich(project.tags.join(' · '))}
                  </Text>
                ))}
            </View>
          ))}
        </View>
      );
    case 'entries':
      return (
        <View>
          {block.total && block.variant === 'experience' && (
            <Text style={{ color: t.muted, marginBottom: 6 }}>Total experience: {block.total}</Text>
          )}
          {block.entries.map((entry) => (
            <EntryView key={entry.id} entry={entry} openEnded={block.variant !== 'custom'} s={s} />
          ))}
        </View>
      );
    case 'testimonials':
      return (
        <View>
          {block.testimonials.map((item) => (
            <View
              key={item.id}
              style={{
                marginBottom: 9,
                paddingLeft: 9,
                borderLeftWidth: 2,
                borderLeftColor: s.quoteBar,
              }}
              wrap={false}
            >
              <Text style={t.italic ? { fontFamily: t.display, fontStyle: 'italic' } : {}}>
                {rich(item.message)}
              </Text>
              <Text style={{ marginTop: 3, color: t.muted }}>
                <Text style={{ fontWeight: 700, color: t.ink }}>{rich(item.name)}</Text>
                {item.detail ? <Text>, {rich(item.detail)}</Text> : null}
              </Text>
            </View>
          ))}
        </View>
      );
    case 'writing':
      return (
        <View>
          {block.posts.map((post) => (
            <View key={post.id} style={{ marginBottom: 8 }} wrap={false}>
              <Text
                style={{
                  fontFamily: t.display,
                  fontWeight: 700,
                  fontSize: s.size + 1,
                  color: t.ink,
                }}
              >
                {rich(post.title)}
              </Text>
              <Text style={{ color: t.muted, fontFamily: s.label, fontSize: s.size - 1 }}>
                {formatDate(post.date)}
              </Text>
              {post.excerpt && <Paragraphs text={post.excerpt} style={{ marginTop: 2 }} />}
              <Link
                src={absolute(post.href)}
                style={{ color: t.accentFg, textDecoration: 'none', fontSize: s.size - 1 }}
              >
                {plainUrl(absolute(post.href))}
              </Link>
            </View>
          ))}
        </View>
      );
  }
}
