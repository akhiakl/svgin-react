import { sanitizeSvg } from './sanitizeClient';
import { createFetchAndSanitizeSvg } from './fetchAndSanitizeSvgBase';

export const { fetchAndSanitizeSvg, releaseFetchAndSanitizeSvg } = createFetchAndSanitizeSvg(sanitizeSvg);
