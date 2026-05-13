'use client';

import type {Agent} from '@atproto/api';
import {type ReactNode, createContext, useContext, useMemo} from 'react';

import {useCredentialAuth} from './credential/use-credential-auth';
import {AuthForm} from './auth-form';
import {type UseOAuthOptions, useOAuth} from './oauth/use-oauth';

export interface AuthContext {
    pdsAgent: Agent;
    signOut: () => void;
    refresh: () => void;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

export const AuthProvider = ({
    children,
    ...options
}: {
    children: ReactNode;
} & UseOAuthOptions) => {
    const {
        isLoginPopup,
        isInitializing,
        client: oauthClient,
        agent: oauthAgent,
        signIn: oauthSignIn,
        signOut: oauthSignOut,
        refresh: oauthRefresh,
    } = useOAuth(options);

    const {
        agent: credentialAgent,
        signIn: credentialSignIn,
        signOut: credentialSignOut,
        refresh: credentialRefresh,
    } = useCredentialAuth();

    const value = useMemo<AuthContext | undefined>(() => {
        if (oauthAgent) {
            return {
                pdsAgent: oauthAgent,
                refresh: oauthRefresh,
                signOut: oauthSignOut,
            };
        }

        if (credentialAgent) {
            return {
                pdsAgent: credentialAgent,
                refresh: credentialRefresh,
                signOut: credentialSignOut,
            };
        }

        return undefined;
    }, [
        oauthAgent,
        oauthSignOut,
        credentialAgent,
        credentialSignOut,
        oauthRefresh,
        credentialRefresh,
    ]);

    if (isLoginPopup) {
        return <div>This window can be closed</div>;
    }

    if (isInitializing) {
        return <div>Initializing...</div>;
    }

    if (!value) {
        return (
            <AuthForm
                atpSignIn={credentialSignIn}
                oauthSignIn={oauthClient ? oauthSignIn : undefined}
            />
        );
    }

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export function useAuthContext(): AuthContext {
    const context = useContext(AuthContext);
    if (context) {
        return context;
    }

    throw new Error(`useAuthContext() must be used within an <AuthProvider />`);
}
