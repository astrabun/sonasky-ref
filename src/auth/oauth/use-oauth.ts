'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {Agent} from '@atproto/api';
import {
    type BrowserOAuthClientLoadOptions,
    type OAuthSession,
    BrowserOAuthClient,
    LoginContinuedInParentWindowError,
} from '@atproto/oauth-client-browser';

type Simplify<T> = {[K in keyof T]: T[K]} & NonNullable<unknown>;

export type OnRestored = (
    session: OAuthSession | undefined,
) => void | Promise<void>;
export type OnSignedIn = (
    session: OAuthSession,
    state: string | undefined,
) => void | Promise<void>;
export type OnSignedOut = () => void;

type OAuthSignIn = (input: string) => Promise<void>;

function useValueRef<T>(value: T) {
    const valueRef = useRef(value);
    useEffect(() => {
        valueRef.current = value;
    }, [value]);
    return valueRef;
}

function useCallbackRef<T extends (this: any, ...args: any[]) => any>(
    fn: T,
): (this: ThisParameterType<T>, ...args: Parameters<T>) => ReturnType<T>;

function useCallbackRef<T extends (this: any, ...args: any[]) => any>(
    fn?: T,
): (this: ThisParameterType<T>, ...args: Parameters<T>) => void | ReturnType<T>;

function useCallbackRef<T extends (this: any, ...args: any[]) => any>(fn?: T) {
    const fnRef = useValueRef(fn);
    return useCallback(function callbackRef(
        this: ThisParameterType<T>,
        ...args: Parameters<T>
    ): void | ReturnType<T> {
        const {current} = fnRef;
        if (current) {
            return current.call(this, ...args);
        }
    }, []);
}

type ClientOptions =
    | {client: BrowserOAuthClient}
    | Simplify<
          Pick<
              BrowserOAuthClientLoadOptions,
              | 'clientId'
              | 'handleResolver'
              | 'responseMode'
              | 'plcDirectoryUrl'
              | 'fetch'
              | 'allowHttp'
          >
      >;

function useOAuthClient(
    options: ClientOptions,
    onUpdate?: (sub: string) => void,
    onDelete?: (sub: string) => void,
): BrowserOAuthClient | undefined;
function useOAuthClient(
    options: Partial<
        {client: BrowserOAuthClient} & BrowserOAuthClientLoadOptions
    >,
    onUpdate?: (sub: string) => void,
    onDelete?: (sub: string) => void,
) {
    const {
        client: clientInput,
        clientId,
        handleResolver,
        responseMode,
        plcDirectoryUrl,
        allowHttp,
    } = options;

    const [client, setClient] = useState<BrowserOAuthClient | undefined>(
        clientInput || undefined,
    );
    const fetch = useCallbackRef(options.fetch || globalThis.fetch);

    useEffect(() => {
        if (clientInput) {
            setClient(clientInput);
        } else if (clientId && handleResolver) {
            const ac = new AbortController();
            const {signal} = ac;

            setClient(undefined);

            void BrowserOAuthClient.load({
                allowHttp,
                clientId,
                fetch,
                handleResolver,
                onDelete,
                onUpdate,
                plcDirectoryUrl,
                responseMode,
                signal,
            }).then(
                (client) => {
                    if (!signal.aborted) {
                        signal.addEventListener(
                            'abort',
                            () => {
                                void client[Symbol.asyncDispose]();
                            },
                            {once: true},
                        );
                        setClient(client);
                    } else {
                        void client[Symbol.asyncDispose]();
                    }
                },
                (error) => {
                    if (!signal.aborted) {
                        throw error;
                    }
                },
            );

            return () => ac.abort();
        } else {
            setClient(undefined);
        }
    }, [
        clientInput,
        clientId,
        handleResolver,
        responseMode,
        plcDirectoryUrl,
        fetch,
    ]);

    return client;
}

export type UseOAuthOptions = ClientOptions & {
    onRestored?: OnRestored;
    onSignedIn?: OnSignedIn;
    onSignedOut?: OnSignedOut;

    state?: string;
    scope?: string;
};

export function useOAuth(options: UseOAuthOptions) {
    const onRestored = useCallbackRef(options.onRestored);
    const onSignedIn = useCallbackRef(options.onSignedIn);
    const onSignedOut = useCallbackRef(options.onSignedOut);

    const scopeRef = useValueRef(options.scope);
    const stateRef = useValueRef(options.state);

    const [session, setSession] = useState<OAuthSession | undefined>();
    const [client, setClient] = useState<BrowserOAuthClient | undefined>();
    const [isInitializing, setIsInitializing] = useState(true);
    const [isLoginPopup, setIsLoginPopup] = useState(false);

    // Refs so that onUpdate/onDelete callbacks (baked into the client at
    // Construction time) always see the latest session and client values.
    const sessionRef = useValueRef(session);
    const clientRef = useValueRef(client);

    // Stable callbacks passed to BrowserOAuthClient at construction time.
    // The new API (oauth-client >= 0.6) removed addEventListener in favour of
    // These constructor-time hooks.
    const onSessionUpdate = useCallbackRef((sub: string) => {
        const currentClient = clientRef.current;
        const currentSession = sessionRef.current;
        if (currentClient && (!currentSession || currentSession.sub !== sub)) {
            setSession(undefined);
            void currentClient.restore(sub, false).then(setSession);
        }
    });

    const onSessionDelete = useCallbackRef((sub: string) => {
        if (sessionRef.current?.sub === sub) {
            setSession(undefined);
            onSignedOut();
        }
    });

    const clientForInit = useOAuthClient(
        options,
        onSessionUpdate,
        onSessionDelete,
    );

    const clientForInitRef = useRef<typeof clientForInit>(null);
    useEffect(() => {
        // In strict mode, we don't want to re-init() the client if it's the same
        if (clientForInitRef.current === clientForInit) {
            return;
        }
        clientForInitRef.current = clientForInit;

        setSession(undefined);
        setClient(undefined);
        setIsLoginPopup(false);
        setIsInitializing(clientForInit != undefined);

        clientForInit
            ?.init()
            .then(
                async (r) => {
                    if (clientForInitRef.current !== clientForInit) {
                        return;
                    }

                    setClient(clientForInit);
                    if (r) {
                        setSession(r.session);

                        if ('state' in r) {
                            await onSignedIn(r.session, r.state || '');
                        } else {
                            await onRestored(r.session);
                        }
                    } else {
                        await onRestored(undefined);
                    }
                },
                async (error) => {
                    if (clientForInitRef.current !== clientForInit) {
                        return;
                    }
                    if (error instanceof LoginContinuedInParentWindowError) {
                        setIsLoginPopup(true);
                        return;
                    }

                    setClient(clientForInit);
                    await onRestored(undefined);

                    console.error('Failed to init:', error);
                },
            )
            .finally(() => {
                if (clientForInitRef.current !== clientForInit) {
                    return;
                }

                setIsInitializing(false);
            });
    }, [clientForInit, onSignedIn, onRestored]);

    const signIn = useCallback<OAuthSignIn>(
        async (input) => {
            if (!client) {
                throw new Error('Client not initialized');
            }
            const state = stateRef.current;
            const scope = scopeRef.current;
            const session = await client.signIn(input, {scope, state});
            setSession(session);
            await onSignedIn(session, state ?? undefined);
        },
        [client, onSignedIn],
    );

    // Memoize the return value to avoid re-renders in consumers
    return useMemo(
        () => ({
            agent: session ? new Agent(session) : undefined,
            client,
            isInitialized: client != undefined,
            isInitializing,
            isLoginPopup,
            refresh: () => session?.getTokenInfo(true),
            signIn,
            signOut: () => session?.signOut(),
        }),
        [isInitializing, isLoginPopup, session, client, signIn],
    );
}
