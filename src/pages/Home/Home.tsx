import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Layout from "../../layouts/Home";
import { Container, TextField, Button, Box, Typography, InputAdornment } from '@mui/material';

function Home() {
  const [handle, setHandle] = useState('');
  const navigate = useNavigate();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHandle(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const finalHandle = handle.startsWith('did:plc:') || handle.includes('.') ? handle : `${handle}.bsky.social`;
    navigate(`/profile/${finalHandle}`);
  };

  return (
    <Layout>
      <Container maxWidth="sm">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <Box display="flex" alignItems="center" width="100%">
            <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%' }} autoComplete="off">
              <TextField
                label="Bluesky Handle"
                variant="outlined"
                value={handle}
                onChange={handleChange}
                placeholder="some-username-here"
                fullWidth
                margin="normal"
                autoComplete="new-password"
                InputProps={{
                  endAdornment: !(handle.startsWith('did:plc:') || handle.includes('.')) && (
                    <InputAdornment position="end">
                      <Typography variant="body2" color="textSecondary">
                        .bsky.social
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmit} 
                style={{ marginLeft: '10px' }}
              >
                View
              </Button>
            </form>
          </Box>
          <Typography variant="body2" gutterBottom>
            Enter a Bluesky handle to view the user's character(s)/info.
          </Typography>
        </Box>
      </Container>
    </Layout>
  );
}

export default Home;