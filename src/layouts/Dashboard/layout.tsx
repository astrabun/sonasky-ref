import { Alert, AlertTitle, Box, Button, Container, Typography } from '@mui/material';
import React from 'react';
import Header from '../../assets/partials/Header';
import { AuthProvider } from '../../auth/auth-provider';
import { clientId } from '../../App';
import { ENV, FLAGS, HANDLE_RESOLVER_URL, PLC_DIRECTORY_URL } from '../../const';
import InnerDashLayout from './innerDash';
import { latestVersion } from '../../changelog';
import { Link } from 'react-router';

interface LayoutProps {
  children?: React.ReactNode;
}

function Layout(props: LayoutProps) {
  const { children } = { ...props };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <AuthProvider
        clientId={clientId}
        plcDirectoryUrl={PLC_DIRECTORY_URL}
        handleResolver={HANDLE_RESOLVER_URL}
        allowHttp={ENV === 'development' || ENV === 'test'}
      >
        <Header hideNavigation />
        <Container>
          <Box component="main" flex="1">
            {FLAGS.SHOW_FEEDBACK_FORM_ALERT && <>
              <Alert severity="info" style={{ margin: '1rem 0' }}>
                <AlertTitle>Seeking Feedback!</AlertTitle>
                <Typography>
                  I'm looking for feedback on the SonaSky REF project. If you have any thoughts/feature requests/bug reports/positive feedback/etc, please <a href="/feedback" target='_blank' style={{ color: "inherit" }}>click here</a> to fill out a feedback form!
                </Typography>
                <Button href="/feedback" target='_blank' style={{ marginTop: '1rem' }} variant="contained">Feedback Form</Button>
              </Alert>
            </>}
            <InnerDashLayout>
              {children}
            </InnerDashLayout>
          </Box>
        </Container>
      </AuthProvider>
      <footer style={{
        // make footer stick to the bottom of the window on short pages
        marginTop: 'auto',
      }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          color="#fff"
          bgcolor="#283546"
          height={50}
        >
          <Link to={`/dashboard/changelog`} style={{ color: "inherit" }}>Version: {latestVersion.version}</Link> &nbsp;| Made with 💙 by &nbsp;<a href="https://bsky.app/profile/astra.bunnys.ky" target="_blank" style={{ color: "inherit" }}>Astra</a>
        </Box>
      </footer>
    </Box>
  );
}

export default Layout;
