import React from 'react';
import { createRoot } from 'react-dom/client';
import { SvgIn } from '../../src/SvgIn.client';

// Small harness driven entirely by query params, so Playwright specs can
// point the same page at different scenarios (single icon, id-collision
// fixture repeated N times, a malicious fixture, a broken URL) without a
// bespoke page per test.
//
//   ?src=/fixtures/plain.svg   fixture to render (repeatable via &src=...)
//   ?count=300                 how many <SvgIn> instances to mount
//   ?a11y=1                    pass title/description props
//   ?unsafe=1                  pass disableSanitization
//
// Test hooks exposed on window (read by Playwright, never used by real
// consumers of the package); the type merge lives in e2e/global.d.ts:
//   __svginMounted   number of onMount firings so far
//   __svginErrors    array of error.message strings from onError
//   __svginReady     true once every requested instance has either
//                    mounted or errored (stress-test completion signal)
window.__svginMounted = 0;
window.__svginErrors = [];
window.__svginReady = false;

const params = new URLSearchParams(location.search);
const srcs = params.getAll('src');
const count = Number(params.get('count') ?? '1');
const withA11y = params.get('a11y') === '1';
const unsafe = params.get('unsafe') === '1';
const total = count * Math.max(srcs.length, 1);

function App() {
  const settled = React.useRef(0);
  const markSettled = () => {
    settled.current += 1;
    if (settled.current >= total) window.__svginReady = true;
  };

  const list = srcs.length > 0 ? srcs : ['/fixtures/plain.svg'];
  const instances = Array.from({ length: count }, (_, i) => i).flatMap((i) =>
    list.map((src, j) => (
      <SvgIn
        key={`${i}-${j}`}
        src={src}
        width={24}
        height={24}
        disableSanitization={unsafe}
        title={withA11y ? 'Test icon' : undefined}
        description={withA11y ? 'A test icon for e2e assertions' : undefined}
        onMount={() => {
          window.__svginMounted += 1;
          markSettled();
        }}
        onError={(err) => {
          window.__svginErrors.push(err.message);
          markSettled();
        }}
      />
    ))
  );

  return <div data-testid="svgin-grid">{instances}</div>;
}

createRoot(document.getElementById('root')!).render(<App />);
