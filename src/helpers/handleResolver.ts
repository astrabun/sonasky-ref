import {HANDLE_RESOLVER_URL} from '../const';

// eslint-disable-next-line unicorn/no-null
const UNRESOLVED = null;

const didDocUrl = (did: string): string =>
    did.startsWith('did:web:')
        ? `https://${did.slice('did:web:'.length)}/.well-known/did.json`
        : `https://plc.directory/${did}`;

/**
 * Handle resolver with three fallback tiers:
 * 1. /.well-known/atproto-did on the handle domain
 * 2. /.well-known/did.json on the handle domain (did:web where handle === domain)
 * 3. bsky.social XRPC -> if the returned DID doesn't claim the handle, resolve its
 *    DID document to find the PDS, then ask the PDS to re-resolve the handle.
 *    This covers did:web users on independent PDSes whose handle domain differs
 *    from their did:web domain.
 *
 * Tiers 1 and 2 may fail silently due to CORS.
 */
export const handleResolver = {
    async resolve(
        handle: string,
        options?: {signal?: AbortSignal},
    ): Promise<string | null> {
        // Tier 1: standard atproto well-known
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
            // CORS or network failure
        }

        // Tier 2: treat handle as a did:web domain
        try {
            const response = await fetch(
                `https://${handle}/.well-known/did.json`,
                {signal: options?.signal},
            );
            if (response.ok) {
                const doc = (await response.json()) as {
                    id?: string;
                    alsoKnownAs?: string[];
                };
                if (
                    doc.id?.startsWith('did:') &&
                    doc.alsoKnownAs?.includes(`at://${handle}`)
                ) {
                    return doc.id;
                }
            }
        } catch {
            // CORS or network failure
        }

        // Tier 3: bsky.social XRPC, then verify via DID doc + PDS fallback
        try {
            const url = new URL(
                '/xrpc/com.atproto.identity.resolveHandle',
                HANDLE_RESOLVER_URL,
            );
            url.searchParams.set('handle', handle);
            const xrpcResponse = await fetch(url.toString(), {
                signal: options?.signal,
            });
            if (!xrpcResponse.ok) {
                return UNRESOLVED;
            }
            const xrpcData = (await xrpcResponse.json()) as {did?: string};
            const candidateDid = xrpcData.did;
            if (!candidateDid) {
                return UNRESOLVED;
            }

            // Resolve the candidate DID document to verify bi-directional match
            const docResponse = await fetch(didDocUrl(candidateDid), {
                signal: options?.signal,
            });
            if (!docResponse.ok) {
                return UNRESOLVED;
            }
            const doc = (await docResponse.json()) as {
                alsoKnownAs?: string[];
                service?: {type: string; serviceEndpoint: string}[];
            };

            // Candidate DID already claims this handle - good to go
            if (doc.alsoKnownAs?.includes(`at://${handle}`)) {
                return candidateDid;
            }

            // Candidate DID claims a different handle - ask its PDS directly
            const pds = doc.service?.find(
                (s) => s.type === 'AtprotoPersonalDataServer',
            )?.serviceEndpoint;
            if (!pds) {
                return UNRESOLVED;
            }
            const pdsUrl = new URL(
                '/xrpc/com.atproto.identity.resolveHandle',
                pds,
            );
            pdsUrl.searchParams.set('handle', handle);
            const pdsResponse = await fetch(pdsUrl.toString(), {
                signal: options?.signal,
            });
            if (!pdsResponse.ok) {
                return UNRESOLVED;
            }
            const pdsData = (await pdsResponse.json()) as {did?: string};
            return pdsData.did ?? UNRESOLVED;
        } catch {
            return UNRESOLVED;
        }
    },
};
