import { useEffect, useMemo, useState } from 'react';
import { SvgIn } from '../../src/client';
import { sanitizeSvg } from '../../src/utils/sanitizeClient';
import { examples } from './examples';
import { diffSanitization } from './diff';

type Tab = 'preview' | 'markup' | 'changes';

export default function App() {
    const [svgText, setSvgText] = useState(examples[0].svg);
    const [activeExample, setActiveExample] = useState(examples[0].id);
    const [sanitized, setSanitized] = useState<string | null>(null);
    const [sanitizeError, setSanitizeError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>('preview');
    const [showUnsanitized, setShowUnsanitized] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [urlLoading, setUrlLoading] = useState(false);
    const [urlError, setUrlError] = useState<string | null>(null);

    // Runs the actual library sanitizer (the same one <SvgIn> uses under the
    // hood) so the "what changed" panel reflects real behavior, not an
    // approximation of it.
    useEffect(() => {
        let cancelled = false;
        setSanitizeError(null);
        sanitizeSvg(svgText)
            .then((result) => { if (!cancelled) setSanitized(result); })
            .catch((e) => { if (!cancelled) setSanitizeError(e instanceof Error ? e.message : String(e)); });
        return () => { cancelled = true; };
    }, [svgText]);

    const diff = useMemo(
        () => (sanitized !== null ? diffSanitization(svgText, sanitized) : null),
        [svgText, sanitized]
    );

    async function loadFromUrl() {
        if (!urlInput.trim()) return;
        setUrlLoading(true);
        setUrlError(null);
        try {
            const res = await fetch(urlInput.trim());
            if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
            const text = await res.text();
            setSvgText(text);
            setActiveExample('');
        } catch (e) {
            // Most failures here are the target server's CORS policy, not a
            // bug in this page - fetch() cannot read a cross-origin response
            // body unless that server opts in with Access-Control-Allow-Origin.
            setUrlError(
                e instanceof Error
                    ? `${e.message} (often a CORS restriction on the source - try pasting the markup directly instead)`
                    : String(e)
            );
        } finally {
            setUrlLoading(false);
        }
    }

    return (
        <div className="page">
            <header className="hero">
                <div className="hero-inner">
                    <p className="eyebrow">svgin-react</p>
                    <h1>See what actually gets stripped, before it happens to you.</h1>
                    <p className="lede">
                        Paste any SVG - your own icon, or something you do not fully trust - and inspect exactly what
                        the default sanitizer removes, in real time, using the real library code.
                    </p>
                    <div className="hero-links">
                        <a href="https://www.npmjs.com/package/svgin-react">npm</a>
                        <a href="https://github.com/akhiakl/svgin-react">GitHub</a>
                        <a href="https://github.com/akhiakl/svgin-react#readme">Docs</a>
                    </div>
                </div>
            </header>

            <main className="layout">
                <section className="panel input-panel">
                    <div className="panel-header">
                        <h2>Input</h2>
                        <div className="examples">
                            {examples.map((ex) => (
                                <button
                                    key={ex.id}
                                    type="button"
                                    className={activeExample === ex.id ? 'chip chip-active' : 'chip'}
                                    onClick={() => {
                                        setSvgText(ex.svg);
                                        setActiveExample(ex.id);
                                    }}
                                    title={ex.description}
                                >
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea
                        className="code-input"
                        spellCheck={false}
                        value={svgText}
                        onChange={(e) => {
                            setSvgText(e.target.value);
                            setActiveExample('');
                        }}
                        rows={16}
                    />

                    <div className="url-loader">
                        <input
                            type="url"
                            placeholder="or load from a URL (https://...)"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadFromUrl()}
                        />
                        <button type="button" onClick={loadFromUrl} disabled={urlLoading}>
                            {urlLoading ? 'Loading…' : 'Load'}
                        </button>
                    </div>
                    {urlError && <p className="error-text">{urlError}</p>}
                </section>

                <section className="panel output-panel">
                    <div className="tabs">
                        <button
                            type="button"
                            className={tab === 'preview' ? 'tab tab-active' : 'tab'}
                            onClick={() => setTab('preview')}
                        >
                            Preview
                        </button>
                        <button
                            type="button"
                            className={tab === 'changes' ? 'tab tab-active' : 'tab'}
                            onClick={() => setTab('changes')}
                        >
                            What changed{diff && (diff.removedTags.length || diff.removedAttrs.length) ? ' ●' : ''}
                        </button>
                        <button
                            type="button"
                            className={tab === 'markup' ? 'tab tab-active' : 'tab'}
                            onClick={() => setTab('markup')}
                        >
                            Sanitized markup
                        </button>
                    </div>

                    {sanitizeError && <p className="error-text">Sanitize failed: {sanitizeError}</p>}

                    {tab === 'preview' && (
                        <div className="preview-area">
                            <div className="preview-tile">
                                <SvgIn svg={svgText} width={96} height={96} fallback={<span>—</span>} />
                                <span className="preview-caption">sanitized (default)</span>
                            </div>

                            <label className="danger-toggle">
                                <input
                                    type="checkbox"
                                    checked={showUnsanitized}
                                    onChange={(e) => setShowUnsanitized(e.target.checked)}
                                />
                                Show unsanitized too (may run scripts in this tab)
                            </label>
                            {showUnsanitized && (
                                <div className="preview-tile danger">
                                    <SvgIn svg={svgText} width={96} height={96} disableSanitization fallback={<span>—</span>} />
                                    <span className="preview-caption">raw, unsanitized</span>
                                </div>
                            )}

                            <div className="dupe-demo">
                                <p className="dupe-caption">
                                    Two independent instances of the same markup - internal ids (gradients, clip
                                    paths) are made unique per instance automatically, so they never collide:
                                </p>
                                <div className="dupe-row">
                                    <SvgIn svg={svgText} width={56} height={56} fallback={<span>—</span>} />
                                    <SvgIn svg={svgText} width={56} height={56} fallback={<span>—</span>} />
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'changes' && diff && (
                        <div className="changes-area">
                            {diff.removedTags.length === 0 && diff.removedAttrs.length === 0 ? (
                                <p className="muted">Nothing was removed - this markup was already clean.</p>
                            ) : (
                                <>
                                    {diff.removedTags.length > 0 && (
                                        <div className="change-group">
                                            <h3>Elements removed</h3>
                                            <ul>
                                                {diff.removedTags.map((t) => (
                                                    <li key={t}>
                                                        <code>&lt;{t}&gt;</code>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {diff.removedAttrs.length > 0 && (
                                        <div className="change-group">
                                            <h3>Attributes removed</h3>
                                            <ul>
                                                {diff.removedAttrs.map((a) => (
                                                    <li key={a}>
                                                        <code>{a}</code>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <p className="muted">{diff.bytesRemoved} fewer bytes after sanitization.</p>
                                </>
                            )}
                        </div>
                    )}

                    {tab === 'markup' && (
                        <pre className="code-output">
                            <code>{sanitized ?? '…'}</code>
                        </pre>
                    )}
                </section>
            </main>

            <footer className="footer">
                <p>
                    Everything on this page runs in your browser - nothing you paste here is sent anywhere.{' '}
                    <a href="https://github.com/akhiakl/svgin-react/blob/main/SECURITY.md">Security policy</a>
                </p>
            </footer>
        </div>
    );
}
