import { useRef, useState } from 'react';
import { api } from '@/lib/client-api';
import { PROBLEMS } from '@/lib/messages';
import { useEditor } from './editor-context';

interface Options {
  // The API path that takes the image (POST) and removes it (DELETE). With none, nothing happens.
  endpoint: string | null;
  field: string; // the multipart field the API reads
  resultKey: string; // the key of the new address in the API's reply
  types: readonly string[];
  maxBytes: number;
  tooLarge: string;
  uploaded: string; // what the toast says after an upload
  removed: string; // ... and after a removal
  // Called with the new address, or null when the image was removed.
  onChange: (url: string | null) => void;
}

// An image that can be uploaded and removed: the same limits as the API checked first so a wrong
// file fails at once, then the request, a toast and the `busy` flag around it.
export function useImageUpload(options: Options) {
  const { endpoint, field, resultKey, types, maxBytes, tooLarge, uploaded, removed, onChange } =
    options;
  const { notify, attempt } = useEditor();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined) {
    if (!file || !endpoint) return;
    if (!types.includes(file.type)) return notify('error', PROBLEMS.imageType);
    if (file.size > maxBytes) return notify('error', tooLarge);

    const form = new FormData();
    form.append(field, file);
    setBusy(true);
    await attempt(async () => {
      const result = await api<Record<string, string>>(endpoint, { method: 'POST', form });
      onChange(result[resultKey]);
    }, uploaded);
    setBusy(false);
  }

  async function remove() {
    if (!endpoint) return;
    setBusy(true);
    await attempt(async () => {
      await api(endpoint, { method: 'DELETE' });
      onChange(null);
    }, removed);
    setBusy(false);
  }

  return { input, busy, upload, remove };
}
