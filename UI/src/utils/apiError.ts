import type { ToastServiceMethods } from "primevue/toastservice";

export async function extractApiErrorMessage(response: Response, fallback: string): Promise<string> {
    const errorBody = await response.json().catch(() => null);
    return errorBody?.error || fallback;
}

export function showApiErrorToast(toast: ToastServiceMethods, summary: string, error: unknown): void {
    toast.add({
        severity: 'error',
        summary,
        detail: error instanceof Error ? error.message : undefined,
        life: 5000,
    });
}
