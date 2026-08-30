// Generates a short, unique-enough-per-page suffix for SVG id uniquification
// (see uniquifyIds in svgUtils.ts). A plain incrementing counter is enough:
// the only failure mode of a collision is two unrelated <SvgIn> instances
// sharing a gradient/clip-path/filter definition - a cosmetic bug, not a
// security issue - so this favors being cheap and simple over cryptographic
// uniqueness.
let counter = 0;

export function nextInstanceId(): string {
    return `svgin${counter++}`;
}
