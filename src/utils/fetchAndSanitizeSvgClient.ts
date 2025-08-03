import { sanitizeSvg } from './sanitizeClient';
import { createFetchAndSanitizeSvg } from './fetchAndSanitizeSvgBase';

export const fetchAndSanitizeSvg = createFetchAndSanitizeSvg(sanitizeSvg);
