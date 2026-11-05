// The limits on what can be uploaded, in one place: the API enforces them, the dashboard checks
// them first so a wrong file fails at once, and both quote them in their messages.

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024; // an avatar or a post cover
export const RESUME_MAX_BYTES = 5 * 1024 * 1024; // the API's limit for a resume PDF
// Request bodies through the site's /api proxy on Vercel are capped at 4.5 MB, so the dashboard
// holds a resume to that, which is a little below what the API itself would take.
export const RESUME_PROXY_MAX_BYTES = 4.5 * 1024 * 1024;

// A project's or post's cover is stored at this size (the shape link previews use).
export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 630;

const MB = 1024 * 1024;
export const megabytes = (bytes: number) => `${bytes / MB} MB`; // "2 MB", "4.5 MB"
