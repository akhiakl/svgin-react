import { sanitizeSvg } from './sanitizeServer';
import { createSanitizeSvgString } from './sanitizeSvgStringBase';

export const sanitizeSvgString = createSanitizeSvgString(sanitizeSvg);
