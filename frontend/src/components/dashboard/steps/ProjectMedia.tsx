'use client';

import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import {
  IMAGE_ALT_MAX,
  IMAGE_MAX_BYTES,
  IMAGE_TYPES,
  MAX_PROJECT_IMAGES,
  megabytes,
  type MyProfile,
} from '@parichay/shared';
import { api } from '@/lib/client-api';
import { NOTICES, PROBLEMS } from '@/lib/messages';
import { TextField } from '../../form-fields';
import { Button, Input, SlowNotice } from '../../ui';
import { errorText, useEditor, type SectionItem } from '../editor-context';
import { SortableList } from '../SortableList';
import { PhotoField } from '../photo/PhotoField';
import { useImageUpload } from '../use-image-upload';

const COVER_WIDTH = 1200;
const COVER_ASPECT = COVER_WIDTH / 630;

type Project = SectionItem<'projects'>;
type GalleryImage = Project['images'][number];

// Changes one project in the saved profile, for the images that are saved the moment they change.
function useProjectUpdate(projectId: string) {
  const { update } = useEditor();
  return (change: (project: Project) => Project) =>
    update((p: MyProfile) => ({
      ...p,
      projects: p.projects.map((project) => (project.id === projectId ? change(project) : project)),
    }));
}

function CoverImage({ project }: { project: Project }) {
  const change = useProjectUpdate(project.id);
  const { busy, submit, remove } = useImageUpload({
    endpoint: `/profile/me/projects/${project.id}/cover`,
    field: 'cover',
    resultKey: 'coverUrl',
    types: IMAGE_TYPES,
    maxBytes: IMAGE_MAX_BYTES,
    tooLarge: PROBLEMS.coverTooLarge,
    uploaded: NOTICES.projectCoverSaved,
    removed: NOTICES.projectCoverRemoved,
    onResult: (result) =>
      change((p) => ({
        ...p,
        coverWidth: result.coverWidth as number,
        coverHeight: result.coverHeight as number,
      })),
    onChange: (url) =>
      change((p) =>
        url
          ? { ...p, coverUrl: url }
          : { ...p, coverUrl: null, coverAlt: null, coverWidth: null, coverHeight: null },
      ),
  });

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Cover image (optional)</p>
      {project.coverUrl && (
        // A plain <img>, like the avatar: the address is Cloudinary's.
        <img
          src={project.coverUrl}
          alt={`Cover of ${project.name}`}
          referrerPolicy="no-referrer"
          className="aspect-[1200/630] w-full max-w-sm rounded-card object-cover"
        />
      )}
      <PhotoField
        // Covers are stored at 1200 × 630, so that is the shape to crop.
        aspect={COVER_ASPECT}
        maxWidth={COVER_WIDTH}
        round={false}
        hasCurrent={!!project.coverUrl}
        busy={busy}
        chooseLabel="Add a cover image"
        changeLabel="Change image"
        onSave={submit}
        onRemove={remove}
        current={null}
      >
        {project.coverUrl && (
          <Button variant="danger" size="sm" disabled={busy} onClick={remove}>
            <Trash2 aria-hidden="true" className="size-4" />
            Remove image
          </Button>
        )}
        <p className="text-xs text-muted">
          It leads the project’s page and is the picture people see when it is shared.
        </p>
        <SlowNotice pending={busy} />
      </PhotoField>
      {project.coverUrl && (
        <TextField
          name="coverAlt"
          label="Cover image description"
          maxLength={IMAGE_ALT_MAX}
          hint="Say what the picture shows, for people who can’t see it. Left blank, the project’s name is used."
        />
      )}
    </div>
  );
}

// One image of the gallery: its picture, a description saved when you leave the field, and Delete.
function GalleryRow({
  project,
  image,
  number,
  handle,
}: {
  project: Project;
  image: GalleryImage;
  number: number;
  handle: React.ReactNode;
}) {
  const { notify, attempt } = useEditor();
  const change = useProjectUpdate(project.id);
  const [alt, setAlt] = useState(image.alt ?? '');
  const [busy, setBusy] = useState(false);
  const base = `/profile/me/projects/${project.id}/images/${image.id}`;

  async function saveAlt() {
    if (alt.trim() === (image.alt ?? '')) return;
    try {
      const saved = await api<GalleryImage>(base, { method: 'PUT', body: { alt } });
      change((p) => ({
        ...p,
        images: p.images.map((it) => (it.id === image.id ? { ...it, alt: saved.alt } : it)),
      }));
      setAlt(saved.alt ?? '');
    } catch (err) {
      notify('error', PROBLEMS.altNotSaved(errorText(err)));
    }
  }

  async function remove() {
    setBusy(true);
    const done = await attempt(async () => {
      await api(base, { method: 'DELETE' });
      change((p) => ({ ...p, images: p.images.filter((it) => it.id !== image.id) }));
    }, NOTICES.projectImageRemoved);
    if (!done) setBusy(false);
  }

  const id = `image-alt-${image.id}`;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-box border border-line p-2">
      {handle}
      <img
        src={image.url}
        alt=""
        referrerPolicy="no-referrer"
        width={64}
        height={64}
        className="size-16 shrink-0 rounded-control object-cover"
      />
      <div className="min-w-0 flex-1 basis-48">
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
          Description of image {number}
        </label>
        <Input
          id={id}
          value={alt}
          maxLength={IMAGE_ALT_MAX}
          placeholder="What the picture shows"
          onChange={(e) => setAlt(e.target.value)}
          onBlur={() => void saveAlt()}
          onKeyDown={(e) => {
            // Enter would send the project's form: it only finishes this description.
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
      </div>
      <Button
        variant="danger"
        disabled={busy}
        onClick={() => void remove()}
        aria-label={`Delete image ${number}`}
      >
        <Trash2 aria-hidden="true" className="size-4" />
        <span className="max-sm:sr-only">Delete</span>
      </Button>
    </div>
  );
}

function Gallery({ project }: { project: Project }) {
  const { notify } = useEditor();
  const change = useProjectUpdate(project.id);
  const images = project.images;
  const full = images.length >= MAX_PROJECT_IMAGES;
  const { input, busy, upload } = useImageUpload({
    endpoint: full ? null : `/profile/me/projects/${project.id}/images`,
    field: 'image',
    resultKey: 'url',
    types: IMAGE_TYPES,
    maxBytes: IMAGE_MAX_BYTES,
    tooLarge: PROBLEMS.coverTooLarge,
    uploaded: NOTICES.projectImageAdded,
    removed: NOTICES.projectImageRemoved,
    onResult: (result) =>
      change((p) => ({ ...p, images: [...p.images, result as unknown as GalleryImage] })),
    onChange: () => {},
  });

  // Shows the new order at once and tells the server; if that fails, puts the old order back.
  async function reorder(ids: string[]) {
    const before = images;
    change((p) => ({
      ...p,
      images: ids.flatMap((id) => p.images.find((it) => it.id === id) ?? []),
    }));
    try {
      await api(`/profile/me/projects/${project.id}/images/reorder`, {
        method: 'PATCH',
        body: { ids },
      });
    } catch (err) {
      change((p) => ({ ...p, images: before }));
      notify('error', PROBLEMS.imageOrderNotSaved(errorText(err)));
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Gallery ({images.length} of {MAX_PROJECT_IMAGES})
      </p>
      {images.length > 0 && (
        <SortableList
          items={images}
          onReorder={(ids) => void reorder(ids)}
          label={(image) => `image ${images.indexOf(image) + 1}`}
          renderItem={(image, handle) => (
            <GalleryRow
              project={project}
              image={image}
              number={images.indexOf(image) + 1}
              handle={handle}
            />
          )}
        />
      )}
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {full ? (
        <p className="text-sm text-muted">
          That’s the most images a project can have. Delete one to add another.
        </p>
      ) : (
        <Button disabled={busy} onClick={() => input.current?.click()}>
          <ImagePlus aria-hidden="true" className="size-4" />
          {busy ? 'Working…' : 'Add an image'}
        </Button>
      )}
      <p className="text-xs text-muted">
        JPG, PNG or WebP, up to {megabytes(IMAGE_MAX_BYTES)} each. They show on the project’s page.
        Describe each one so people who can’t see it know what it shows.
      </p>
      <SlowNotice pending={busy} />
    </div>
  );
}

// The pictures of a saved project: a cover and a gallery. They are uploaded the moment they are chosen,
// so a new project has to be saved first.
export function ProjectMedia({ project }: { project?: Project }) {
  if (!project) {
    return (
      <p className="text-sm text-muted">
        Save the project first, then you can add a cover image and a gallery.
      </p>
    );
  }
  return (
    <div className="space-y-5">
      <CoverImage project={project} />
      <Gallery project={project} />
    </div>
  );
}
