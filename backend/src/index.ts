import { app } from './app';
import { config } from './lib/config';
import { startContactRetention } from './services/contact-retention';

app.listen(config.PORT, () => {
  console.log(`Backend listening on http://localhost:${config.PORT} (${config.NODE_ENV})`);
  startContactRetention();
});
