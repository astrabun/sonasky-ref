import { useState, useCallback, useEffect } from "react";
import { useAuthContext } from "../../../auth/auth-provider";
import { PDS_COLLECTION_NS } from "../../../const";
import Layout from "../../../layouts/Dashboard";
import { Button, Container, ListItem, ListItemText, Typography } from '@mui/material';
import { Link } from 'react-router';

export function Characters() {
  const { pdsAgent } = useAuthContext()
  const [sonaRecords, setSonaRecords] = useState<any>()
  const loadSonaRecords = useCallback(async () => {
    const sonaRecords = await pdsAgent.com.atproto.repo.listRecords(
      {
        repo: pdsAgent.accountDid,
        collection: PDS_COLLECTION_NS
      }
    )
    setSonaRecords(sonaRecords.data.records)
  }, [pdsAgent])
  useEffect(() => {
    loadSonaRecords()
  }, [pdsAgent])
  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Characters
        </Typography>
        {sonaRecords !== undefined && <>
          {sonaRecords === null && <Typography variant="body1">No characters found</Typography>}
          {sonaRecords?.map((record: any, idx: number) => (
            <Link key={`chr-${idx}`} to={`/dashboard/characters/edit/${record.uri.split("/").pop()}`} style={{ color: "inherit", textDecoration: "none" }}>
              <ListItem key={record.uri} component={Button} variant="outlined">
                <ListItemText primary={record.value.character.name} secondary={`${record.uri.split("/").pop()}`} />
              </ListItem>
            </Link>
          ))}
        </>}
      </Container>
    </Layout>
  );
}
