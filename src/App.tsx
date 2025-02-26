import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./pages/Home";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Characters from "./pages/Dashboard/Characters";
import CharacterEditor from "./pages/Dashboard/Characters/CharacterEditor";
import ManageData from "./pages/Dashboard/ManageData";
import View from "./pages/View";
import ViewCharacter from "./pages/View/ViewCharacter";
import NotFound from "./pages/NotFound";
import Logout from "./pages/Logout";

import { ENV, HANDLE_RESOLVER_URL, PLC_DIRECTORY_URL } from './const'
import { AuthProvider } from "./auth/auth-provider";
import Changelog from "./pages/Dashboard/Changelog/Changelog";

export const clientId = ENV === 'development' ? `http://localhost?${new URLSearchParams({
  scope: 'atproto transition:generic',
  redirect_uri: Object.assign(new URL(`${window.location.origin}/dashboard`), {
    hostname: '127.0.0.1',
    search: new URLSearchParams({
      env: ENV,
      handle_resolver: HANDLE_RESOLVER_URL,
      ...(PLC_DIRECTORY_URL && { plc_directory_url: PLC_DIRECTORY_URL }),
    }).toString(),
  }).href,
})}` : `https://ref.sonasky.app/client_metadata.json`

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider
      clientId={clientId}
      plcDirectoryUrl={PLC_DIRECTORY_URL}
      handleResolver={HANDLE_RESOLVER_URL}
      allowHttp={ENV === 'development' || ENV === 'test'}
    >
      {children}
    </AuthProvider>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme} noSsr defaultMode="system">
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/logout" element={<AuthWrapper><Logout /></AuthWrapper>} />
          <Route path="/dashboard" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
          <Route path="/dashboard/characters" element={<AuthWrapper><Characters /></AuthWrapper>} />
          <Route path="/dashboard/characters/add" element={<AuthWrapper><CharacterEditor /></AuthWrapper>} />
          <Route path="/dashboard/characters/edit/:rkey" element={<AuthWrapper><CharacterEditor editMode /></AuthWrapper>} />
          <Route path="/dashboard/manage" element={<AuthWrapper><ManageData /></AuthWrapper>} />
          <Route path="/dashboard/changelog" element={<AuthWrapper><Changelog /></AuthWrapper>} />
          <Route path="/profile/:blueskyHandleOrDID" element={<View />} />
          <Route path="/profile/:blueskyHandleOrDID/:rkey" element={<ViewCharacter />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App;
