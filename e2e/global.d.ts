// Test hooks the playground (e2e/playground/main.tsx) exposes on `window`,
// shared by both the harness itself and the Playwright specs that read them
// via page.evaluate()/waitForFunction().
export {};

declare global {
    interface Window {
        __svginMounted: number;
        __svginErrors: string[];
        __svginReady: boolean;
    }
}
