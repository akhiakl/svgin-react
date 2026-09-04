import { sanitizeSvg } from './sanitizeServer';
import { createFetchAndSanitizeSvg } from './fetchAndSanitizeSvgBase';

// releaseFetchAndSanitizeSvg is deliberately not re-exported here: the
// server component has no unmount/cleanup lifecycle to call it from (see
// SvgIn.server.tsx), only the client component needs it.
export const { fetchAndSanitizeSvg } = createFetchAndSanitizeSvg(sanitizeSvg);
