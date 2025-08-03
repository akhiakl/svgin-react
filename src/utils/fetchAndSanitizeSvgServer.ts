import { sanitizeSvg } from './sanitizeServer';
import { createFetchAndSanitizeSvg } from './fetchAndSanitizeSvgBase';

export const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(sanitizeSvg);
