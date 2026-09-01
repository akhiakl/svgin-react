// Small, approximate diff between raw and sanitized SVG markup, purely for
// display on this site ("here is roughly what got removed") - not a
// security primitive and not part of the published package. Regex-based on
// purpose, matching the style already used in src/utils/svgUtils.ts.

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9:-]*)/g;
const ATTR_RE = /\s([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*=/g;

function countOccurrences(re: RegExp, source: string): Map<string, number> {
    const counts = new Map<string, number>();
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(source)) !== null) {
        const key = m[1].toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
}

/** Names present (or more numerous) in `before` than in `after`, most-removed first. */
function removedNames(re: RegExp, before: string, after: string): string[] {
    const beforeCounts = countOccurrences(re, before);
    const afterCounts = countOccurrences(re, after);
    const removed: [string, number][] = [];
    for (const [name, beforeCount] of beforeCounts) {
        const afterCount = afterCounts.get(name) ?? 0;
        if (afterCount < beforeCount) removed.push([name, beforeCount - afterCount]);
    }
    return removed.sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

export interface SanitizeDiff {
    removedTags: string[];
    removedAttrs: string[];
    bytesRemoved: number;
}

export function diffSanitization(raw: string, sanitized: string): SanitizeDiff {
    return {
        removedTags: removedNames(TAG_RE, raw, sanitized),
        removedAttrs: removedNames(ATTR_RE, raw, sanitized),
        bytesRemoved: Math.max(0, raw.length - sanitized.length),
    };
}
