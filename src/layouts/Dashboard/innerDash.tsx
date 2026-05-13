import {Box, Button, Typography} from '@mui/material';
import React, {useCallback, useEffect, useState} from 'react';
import {Link, useLocation} from 'react-router';
import {useAuthContext} from '../../auth/auth-provider';

interface LayoutProps {
    children?: React.ReactNode;
}

function InnerDashLayout(props: LayoutProps) {
    const {children} = {...props};
    const {pdsAgent, signOut} = useAuthContext();

    // This call does not require authentication
    const [profile, setProfile] = useState<unknown>(undefined);
    const loadProfile = useCallback(async () => {
        const profile = await pdsAgent.com.atproto.repo.getRecord({
            collection: 'app.bsky.actor.profile',
            repo: pdsAgent.accountDid,
            rkey: 'self',
        });
        setProfile(profile.data);
    }, [pdsAgent]);

    useEffect(() => {
        void loadProfile();
    }, [pdsAgent]);

    const [sonaRecords, setSonaRecords] = useState<any>();
    const loadSonaRecords = useCallback(async () => {
        const sonaRecords = await pdsAgent.com.atproto.repo.listRecords({
            collection: 'app.sonasky.ref',
            repo: pdsAgent.accountDid,
        });
        setSonaRecords(sonaRecords.data.records);
    }, [pdsAgent]);
    useEffect(() => {
        void loadSonaRecords();
    }, [pdsAgent]);

    const location = useLocation();
    const navItems =
        sonaRecords !== undefined
            ? [
                  {name: 'Home', path: '/'},
                  {name: 'Dashboard', path: '/dashboard'},
                  {
                      name:
                          sonaRecords !== undefined
                              ? `Characters [${sonaRecords.length}]`
                              : 'Characters',
                      path: '/dashboard/characters',
                  },
                  {name: 'Add Character', path: '/dashboard/characters/add'},
                  {name: 'Manage Data', path: '/dashboard/manage'},
                  {name: 'Logout', onclick: signOut},
              ]
            : [
                  {name: 'Home', path: '/'},
                  {name: 'Dashboard', path: '/dashboard'},
                  {name: 'Manage Data', path: '/dashboard/manage'},
                  {name: 'Logout', onclick: signOut},
              ];

    return (
        <>
            <Box display="flex">
                <Box
                    width="200px"
                    p={2}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                    >
                        SonaSky REF
                    </Typography>
                    {navItems.map((item, idx) => {
                        if (item.path) {
                            return (
                                <Button
                                    key={item.path}
                                    component={Link}
                                    to={item.path}
                                    variant={
                                        location.pathname === item.path
                                            ? 'contained'
                                            : 'outlined'
                                    }
                                    fullWidth
                                    style={{
                                        justifyContent: 'flex-start',
                                        marginBottom: '10px',
                                    }}
                                >
                                    {item.name}
                                </Button>
                            );
                        }
                        if (item.onclick) {
                            return (
                                <Button
                                    key={idx}
                                    onClick={item.onclick}
                                    variant={
                                        location.pathname === item.path
                                            ? 'contained'
                                            : 'outlined'
                                    }
                                    fullWidth
                                    style={{
                                        justifyContent: 'flex-start',
                                        marginBottom: '10px',
                                    }}
                                >
                                    {item.name}
                                </Button>
                            );
                        }
                        return <></>;
                    })}
                </Box>
                <Box
                    flexGrow={1}
                    p={2}
                >
                    <div>
                        <p>
                            Logged in as{' '}
                            <a
                                href={`https://bsky.app/profile/${pdsAgent.did}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                }}
                            >
                                {profile
                                    ? (profile as any).value.displayName
                                    : ''}
                            </a>
                        </p>
                    </div>
                    <Box>{children}</Box>
                </Box>
            </Box>
        </>
    );
}

export default InnerDashLayout;
