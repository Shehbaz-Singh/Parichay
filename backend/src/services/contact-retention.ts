import { purgeExpired } from './contact.service';

// Deletes expired contact messages when the server starts and every few hours after. The free tier
// sleeps and restarts, so the sweep also runs on every start; the queries that read messages skip
// expired ones too, so a late sweep never shows an owner a message that is past its time.
const EVERY = 6 * 60 * 60 * 1000;

async function sweep() {
  try {
    const removed = await purgeExpired();
    if (removed > 0) console.log(`Contact messages: removed ${removed} past the retention period`);
  } catch (err) {
    // Only the error is logged, never a message.
    console.error('Contact message cleanup failed:', err instanceof Error ? err.message : err);
  }
}

export function startContactRetention() {
  setTimeout(() => void sweep(), 30_000).unref();
  setInterval(() => void sweep(), EVERY).unref();
}
