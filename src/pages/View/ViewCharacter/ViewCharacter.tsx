import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import Layout from "../../../layouts/View";
import { Container, Typography, Collapse, Fade, Box, Button, emphasize, Grid, Paper, Tooltip, FormControlLabel, Switch, Chip, styled } from '@mui/material';
import { CredentialManager, Client } from '@atcute/client';
import type {} from '@atcute/atproto';
import type { ActorIdentifier } from '@atcute/lexicons';
import { HANDLE_RESOLVER_URL } from '../../../const';
import NotFound from "../../NotFound";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getPds } from '../../../helpers/getPds';

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles('dark', {
  }),
}));

export function ViewCharacter() {
  const manager = new CredentialManager({ service: HANDLE_RESOLVER_URL });
  const [rpc, setRpc] = useState<Client>(new Client({ handler: manager }));
  const { blueskyHandleOrDID, rkey } = useParams<{ blueskyHandleOrDID: string, rkey: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("Loading.");
  const transitionTime = 2000;
  const [refSheetImage, setRefSheetImage] = useState<string>("");
  const [altRefSheetImage, setAltRefSheetImage] = useState<string>("");
  const [showAltRef, setShowAltRef] = useState<boolean>(false);

  const [copyColorClicked, setCopyColorClicked] = useState<boolean>(false);

  const handleGetPds = async () => {
    if(blueskyHandleOrDID){
      const pds = await getPds(blueskyHandleOrDID);
      if(HANDLE_RESOLVER_URL !== pds && pds){
        const newRpc = new Client({ handler: new CredentialManager({ service: pds }) });
        setRpc(newRpc);
      }
    }
  };
  
  useEffect(() => {
    handleGetPds();
  }, [blueskyHandleOrDID])

  const loadCharacter = useCallback(async () => {
    try {
      const sonaRecords = await rpc.get('com.atproto.repo.listRecords', {
        params: {
          repo: (blueskyHandleOrDID ?? "") as ActorIdentifier,
          collection: "app.sonasky.ref"
        }
      });
      const record = (sonaRecords.data as any).records.find((rec: any) => rec.uri.split("/").pop() === rkey);
      if (record) {
        setCharacter((record.value as any).character);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Failed to load character', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [blueskyHandleOrDID, rkey, rpc]);

  useEffect(() => {
    loadCharacter();
  }, [loadCharacter]);

  useEffect(() => {
    if (character) {
      if (character.refSheet && character.refSheet.startsWith("at://")) {
        const refSheetDid = character.refSheet.split('/')[2];
        rpc.get('com.atproto.repo.getRecord', { params: { 
          repo: refSheetDid,
          collection: "app.bsky.feed.post",
          rkey: character.refSheet.split("/").pop()
         } }).then((response) => {
          const { data } = response;
          const cid = ((data as any).value as any).embed.images[0].image.ref.$link;
          setRefSheetImage(`https://cdn.bsky.app/img/feed_fullsize/plain/${character.refSheet.split("/")[2]}/${cid}@jpeg`)
         })
      }
      if (character.altRef && character.altRef.startsWith("at://")) {
        const altRefDid = character.altRef.split('/')[2];
        rpc.get('com.atproto.repo.getRecord', { params: { 
          repo: altRefDid,
          collection: "app.bsky.feed.post",
          rkey: character.altRef.split("/").pop()
         } }).then((response) => {
          const { data } = response;
          const cid = ((data as any).value as any).embed.images[0].image.ref.$link;
          setAltRefSheetImage(`https://cdn.bsky.app/img/feed_fullsize/plain/${character.altRef.split("/")[2]}/${cid}@jpeg`)
         })
      }
      setError(false);
    }
  }, [character]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((prev) => {
          if (prev === "Loading...") return "Loading.";
          if (prev === "Loading..") return "Loading...";
          return "Loading..";
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  if (loading) {
    return (
      <Layout>
        <div style={{ marginTop: "2rem" }} />
        <Container maxWidth="lg">
          <Collapse in={loading} timeout={{ enter: 0, exit: transitionTime }}>
            <Typography variant="body1" gutterBottom>
              {loadingText}
            </Typography>
          </Collapse>
        </Container>
      </Layout>
    );
  }

  if (error || !character) {
    return <NotFound />;
  }

  const getBlueskyLink = (atUri: string): string => {
    const parts = atUri.split('/');
    const did = parts[2];
    const rkey = parts[4];
    return `https://bsky.app/profile/${did}/post/${rkey}`;
  };

  return (
    <Layout>
      <div style={{ marginTop: "2rem" }} />
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/profile/${blueskyHandleOrDID}`)}
          sx={{ marginBottom: "1rem" }}
        >
          Back
        </Button>
        <Button
          startIcon={<OpenInNewIcon />}
          component="a"
          href={`https://bsky.app/profile/${blueskyHandleOrDID}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ marginBottom: "1rem", marginLeft: "1rem" }}
        >
          View Bluesky Profile
        </Button>
        <Fade in={!loading} timeout={transitionTime}>
          <div>
            <Box sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <Typography variant="h3">{character.name}</Typography>
              <Typography variant="h5">Species: {character.species}</Typography>
              {character.pronouns && <Typography variant="h6">{character.pronouns}</Typography>}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                {/* if nsfw is okay, display chip */}
                {character.nsfw && <Chip color="warning" label="NSFW" />}
                {/* if draw without asking, display chip */}
                {character.drawWithoutAskingSFW && <Chip color="info" label="OK to draw SFW without asking" />}
                {character.drawWithoutAskingNSFW && <Chip color="error" label="OK to draw NSFW without asking" />}
              </Box>
            </Box>
            {character.description && <>
              {character.description.split("\n").map((line: string, index: number) => (
                <Typography key={index} variant="body1">{line}</Typography>
              ))}
            </>}
            {/* Colors Grid */}
            <Box sx={{ marginTop: "1rem", marginBottom: "1rem" }}>
              <Grid container rowSpacing={1} columnSpacing={1}>
                {character.colors.map((color: any, idx: any) => {
                  let defaultChipLabel = `Click to copy ${color.label} (#${color.hex})`;
                  const handleCopyClick = () => { setCopyColorClicked(true) };
                  const handleMouseLeave = () => { setCopyColorClicked(false) };
                  return (
                    <Item key={`color-${idx}`}>
                      <Tooltip title={copyColorClicked ? "Copied!" : defaultChipLabel} >
                        <Button
                          fullWidth
                          id={color.hex}
                          component={Paper} sx={{
                            padding: "1em",
                            color: `${emphasize(`#${color.hex}`, 1)}`,
                            backgroundColor: `#${color.hex}`,
                            textAlign: "left",
                            justifyContent: "flex-start"
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText(`#${color.hex}`);
                            handleCopyClick();
                          }} onMouseLeave={handleMouseLeave}
                        >
                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography>{color.label}</Typography>
                            <Typography>#{color.hex}</Typography>
                          </Box>
                        </Button>
                      </Tooltip>
                    </Item>
                  )
                })}
              </Grid>
            </Box>
            {/* Ref Sheet */}
            {character.altRef && (
              <FormControlLabel
                control={
                  <Switch
                    checked={showAltRef}
                    onChange={() => setShowAltRef(!showAltRef)}
                    name="showAltRef"
                  />
                }
                label="Toggle Alt Ref"
              />
            )}
            {!showAltRef && refSheetImage && <Box sx={{ marginBottom: "1rem" }}>
              <Typography variant="h5">Ref Sheet</Typography>
              <img
                src={`${refSheetImage}`}
                alt="Ref Sheet"
                style={{ cursor: 'pointer', maxWidth: "100%" }}
                onClick={() => window.open(getBlueskyLink(character.refSheet), '_blank')}
              />
            </Box>}
            {showAltRef && altRefSheetImage && <Box sx={{ marginBottom: "1rem" }}>
              <Typography variant="h5">Alt Ref Sheet</Typography>
              <img
                src={`${altRefSheetImage}`}
                alt="Alt Ref Sheet"
                style={{ cursor: 'pointer', maxWidth: "100%" }}
                onClick={() => window.open(getBlueskyLink(character.altRef), '_blank')}
              />
            </Box>}
          </div>
        </Fade>
      </Container>
    </Layout>
  );
}
