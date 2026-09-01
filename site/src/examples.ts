export interface Example {
    id: string;
    label: string;
    description: string;
    svg: string;
}

export const examples: Example[] = [
    {
        id: 'clean',
        label: 'Clean icon',
        description: 'A normal icon - passes through untouched.',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
  <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" stroke-width="2" />
</svg>`,
    },
    {
        id: 'gradient',
        label: 'Gradient + defs',
        description: 'Internal ids survive sanitization, then get made unique per instance (open the "two copies" panel below).',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f97316" />
      <stop offset="1" stop-color="#ec4899" />
    </linearGradient>
    <clipPath id="c">
      <circle cx="12" cy="12" r="10" />
    </clipPath>
  </defs>
  <rect x="0" y="0" width="24" height="24" fill="url(#g)" clip-path="url(#c)" />
</svg>`,
    },
    {
        id: 'malicious',
        label: 'Untrusted payload',
        description: 'Carries a <script> tag, an onload handler, and a javascript: href - the exact shape of a real SVG XSS attempt.',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="alert('svg onload')">
  <script>alert('svg script tag')</script>
  <circle cx="12" cy="12" r="10" onmouseover="alert('svg onmouseover')" />
  <a href="javascript:alert('svg javascript href')">
    <rect x="4" y="4" width="16" height="16" />
  </a>
</svg>`,
    },
];
