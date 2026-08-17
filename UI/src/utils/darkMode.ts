const DARK_MODE_STORAGE_KEY = 'coach-frank-dark-mode';
const DARK_MODE_CLASS = 'p-dark';
const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function hasExplicitPreference(): boolean {
    return localStorage.getItem(DARK_MODE_STORAGE_KEY) !== null;
}

// Whether dark mode is currently active: an explicit user choice (from setDarkMode)
// takes priority; otherwise this follows the OS-level prefers-color-scheme setting.
export function isDarkModeActive(): boolean {
    const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (stored !== null) {
        return stored === 'true';
    }
    return darkMediaQuery.matches;
}

// Bootstrap (loaded for layout utilities only) ships its own separate dark-mode
// variable set, gated behind `[data-bs-theme]` rather than our `.p-dark` class -- it
// needs to be kept in sync explicitly, or Bootstrap-styled bits (body background,
// .border-bottom, etc.) stay light while PrimeVue-themed components go dark.
function applyDarkMode(isDark: boolean): void {
    document.documentElement.classList.toggle(DARK_MODE_CLASS, isDark);
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
}

// Call once at startup to apply the current mode.
export function initDarkMode(): void {
    applyDarkMode(isDarkModeActive());
}

// Sets an explicit preference, overriding the system setting from now on.
export function setDarkMode(isDark: boolean): void {
    localStorage.setItem(DARK_MODE_STORAGE_KEY, String(isDark));
    applyDarkMode(isDark);
}

// Notifies `callback` whenever the OS's prefers-color-scheme changes, as long as no
// explicit preference has been set yet, so an open page stays in sync live. Returns
// an unsubscribe function.
export function onSystemDarkModeChange(callback: (isDark: boolean) => void): () => void {
    const listener = (event: MediaQueryListEvent) => {
        if (!hasExplicitPreference()) {
            applyDarkMode(event.matches);
            callback(event.matches);
        }
    };
    darkMediaQuery.addEventListener('change', listener);
    return () => darkMediaQuery.removeEventListener('change', listener);
}
