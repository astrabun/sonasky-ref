import {Box, Container, Typography} from '@mui/material';
import React from 'react';
import {Link} from 'react-router';

interface LayoutProps {
    children?: React.ReactNode;
}

function Layout(props: LayoutProps) {
    const {children} = {...props};
    return (
        <>
            <Container sx={{minHeight: 'calc(100vh - 64px)', pb: 8}}>
                {children}
            </Container>
            <Box
                component="footer"
                sx={{
                    backgroundColor: (theme) => theme.palette.grey[900],
                    bgcolor: (theme) => theme.palette.background.paper,
                    borderTop: (theme) =>
                        `1px solid ${theme.palette.grey[700]}`,
                    bottom: 0,
                    position: 'relative',
                    py: 2,
                    textAlign: 'center',
                    width: '100%',
                }}
            >
                <Typography variant="body2">
                    This is a SonaSky Ref Sheet - Want your own?{' '}
                    <Link
                        to="/dashboard"
                        style={{color: 'inherit'}}
                    >
                        Click here
                    </Link>
                </Typography>
            </Box>
        </>
    );
}

export default Layout;
