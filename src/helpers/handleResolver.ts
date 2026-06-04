import {HANDLE_RESOLVER_URL} from '../const';

// eslint-disable-next-line unicorn/no-null
const UNRESOLVED = null;

/**
 * Custom handle resolver that tries /.well-known/atproto-did on the handle's
 * own domain first, then falls back to bsky.social's resolveHandle XRPC.
 * This allows did:web users on independent PDSes to sign in by handle.
 */
export const handleResolver = {
    async resolve(
        handle: string,
        options?: {signal?: AbortSignal},
    ): Promise<string | null> {
        try {
            const response = await fetch(
                `https://${handle}/.well-known/atproto-did`,
                {signal: options?.signal},
            );
            if (response.ok) {
                const text = await response.text();
                const did = text.trim();
                if (did.startsWith('did:')) {
                    return did;
                }
            }
        } catch {
            // Fall through to XRPC resolver
        }

        try {
            const url = new URL(
                '/xrpc/com.atproto.identity.resolveHandle',
                HANDLE_RESOLVER_URL,
            );
            url.searchParams.set('handle', handle);
            const response = await fetch(url.toString(), {
                signal: options?.signal,
            });
            if (!response.ok) {
                return UNRESOLVED;
            }
            const data = (await response.json()) as {did?: string};
            return data.did ?? UNRESOLVED;
        } catch {
            return UNRESOLVED;
        }
    },
};
