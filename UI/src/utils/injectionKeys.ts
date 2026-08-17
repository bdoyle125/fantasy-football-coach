import type { InjectionKey } from "vue";

// Provided by AppShell.vue (which wraps every page) so any descendant page can tell
// the header's active-league indicator to refresh immediately after an action that
// changes it, instead of waiting for the next route change to pick it up.
export const RefreshActiveLeagueKey: InjectionKey<() => void> = Symbol('refreshActiveLeague');
