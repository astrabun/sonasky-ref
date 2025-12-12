import { Link, useParams } from 'react-router';
import Layout from "../../layouts/View";
import { Container, Typography, Collapse, Fade, Divider, ListItem, ListItemText, Button } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { CredentialManager, Client } from '@atcute/client';
import type {} from '@atcute/atproto';
import type { ActorIdentifier, Handle } from '@atcute/lexicons';
import { HANDLE_RESOLVER_URL } from '../../const';
import { getPds } from '../../helpers/getPds';

function View() {

  const UNKNOWN_ERROR = "INT__UNKNOWN_ERROR__INT";

  const manager = new CredentialManager({ service: HANDLE_RESOLVER_URL });
  const rpc = new Client({ handler: manager });

  const { blueskyHandleOrDID } = useParams<{ blueskyHandleOrDID: string }>();
  const lookupMode = blueskyHandleOrDID?.startsWith('did:') ? 'did' : 'handle';
  const [handle, setHandle] = useState<string | null>(null);
  const [did, setDid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingText, setLoadingText] = useState<string>("Loading.");
  const [error, setError] = useState<boolean>(false);
  const [altPds, setAltPds] = useState<string>();
  useEffect(() => {
    const handleGetPds = async () => {
      if(did){
        const pds = await getPds(did);
        if(HANDLE_RESOLVER_URL !== pds){
          setAltPds(pds);
        }
      }
    };
    handleGetPds();
  }, [did])

  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState<boolean>(false);

  const [repoData, setRepoData] = useState<any | null>(null);
  const [sonaRecords, setSonaRecords] = useState<any | null>(null);
  const loadSonaRecords = useCallback(async () => {
    if(did) {
      await rpc.get('com.atproto.repo.listRecords', {
        params: {
          repo: (did ?? "") as ActorIdentifier,
          collection: "app.sonasky.ref"
        }
      }).then((response) => {
        const { data } = response;
        setSonaRecords((data as any).records)
      })
    }
  }, [repoData])
  useEffect(() => {
    loadSonaRecords()
  }, [repoData])

  const transitionTime = 2000;
  const minLoadingTime = 1000;

  useEffect(() => {
    const minLoadingTimer = setTimeout(() => {
      setMinLoadingTimePassed(true);
    }, minLoadingTime);
    return () => clearTimeout(minLoadingTimer);
  }, []);

  const handleLookupError = (error: any) => {
    setHandle(UNKNOWN_ERROR);
    setDid(UNKNOWN_ERROR);
    if (minLoadingTimePassed) {
      setLoading(false);
      setError(true);
      console.error(error)
    }
  }

  useEffect(() => {
    if (lookupMode === 'did') {
      rpc.get('com.atproto.repo.describeRepo', {
        params: {
          repo: (blueskyHandleOrDID ?? "") as ActorIdentifier
        }
      }).then((response) => {
        const { data } = response;
        if (data) {
          setHandle((data as any).handle);
          setDid((data as any).did);
        } else {
          setHandle(UNKNOWN_ERROR);
          setDid(UNKNOWN_ERROR);
        }
        if (minLoadingTimePassed) {
          setLoading(false);
        }
      }).catch((error) => {
        handleLookupError(error);
      })
    } else {
      rpc.get('com.atproto.identity.resolveHandle', {
        params: {
          handle: (blueskyHandleOrDID ?? "") as Handle
        }
      }).then((response) => {
        const { data } = response;
        if (data) {
          setHandle(blueskyHandleOrDID ?? "");
          setDid((data as any).did);
        } else {
          setHandle(UNKNOWN_ERROR);
          setDid(UNKNOWN_ERROR);
        }
        if (minLoadingTimePassed) {
          setLoading(false);
        }
      }).catch((error) => {
        console.log(error)
        handleLookupError(error);
      })
    }
  }, [blueskyHandleOrDID, minLoadingTimePassed]);

  useEffect(() => {
    if (error) {
      return;
    }
    if (did?.startsWith("did:plc:")) {
      rpc.get('com.atproto.repo.describeRepo', {
        params: {
          repo: (blueskyHandleOrDID ?? "") as Handle
        }
      }).then((response) => {
        const { data } = response;
        setRepoData(data);
      })
    }
  }, [handle, did]);

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

  return (
    <Layout>
      <div style={{ marginTop: "2rem" }} />
      <Container maxWidth="lg">
        <Collapse in={loading} timeout={{ enter: 0, exit: transitionTime }}>
          <Typography variant="body1" gutterBottom>
            {loadingText}
          </Typography>
        </Collapse>
        {error ? <>
          <p>An error occurred. Sorry!</p>
          <Link to="/" style={{ color: "inherit" }}>Go home?</Link>
        </> : <>
          <Fade in={!loading} timeout={transitionTime}>
            <div>
              <a href={`https://bsky.app/profile/${handle}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                <Typography sx={{ typography: { sm: 'h2', xs: 'h4' } }}>@{handle}</Typography>
                <Typography variant="caption" gutterBottom sx={{ marginLeft: "2rem" }}>{did}</Typography>
                {altPds && <>
                  <Typography variant="caption" gutterBottom sx={{ marginLeft: "2rem" }}>PDS: {altPds}</Typography>
                </>}
              </a>
              <Divider sx={{ marginTop: "1rem", marginBottom: "1rem" }} />
              {sonaRecords !== undefined && <>
                {sonaRecords === null ? <Typography variant="body1">No characters found</Typography> : <Typography variant="h4" gutterBottom>Characters</Typography>}
                {sonaRecords?.map((record: any) => (
                  <Link key={record.uri} to={`/profile/${did}/${record.uri.split("/").pop()}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <ListItem component={Button} variant="outlined">
                      <ListItemText primary={record.value.character?.name} secondary={`${record.uri.split("/").pop()}`} />
                    </ListItem>
                  </Link>
                ))}
              </>}
            </div>
          </Fade>
        </>}
      </Container>
    </Layout>
  );
}

export default View;
