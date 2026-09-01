import { sanitizeSvg } from './sanitizeClient';
import { createSanitizeSvgString } from './sanitizeSvgStringBase';

export const sanitizeSvgString = createSanitizeSvgString(sanitizeSvg);
