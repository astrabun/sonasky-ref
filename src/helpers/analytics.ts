import * as Swetrix from 'swetrix';

/**
 * Initialise Swetrix analytics if it has been configured.
 *
 * Both SWETRIX_BASE_URL and SWETRIX_PROJECT_ID must be provided (via the shell
 * env or a local .env file, see .env.example). When either is missing analytics
 * is a no-op, so local/dev builds without the vars send nothing.
 */
export function initAnalytics(): void {
    const baseUrl = import.meta.env.SWETRIX_BASE_URL;
    const projectId = import.meta.env.SWETRIX_PROJECT_ID;

    if (!baseUrl || !projectId) {
        return;
    }

    Swetrix.init(projectId, {
        apiURL: `${baseUrl.replace(/\/+$/, '')}/backend/v1/log`,
    });
    void Swetrix.trackViews();
}
