import Layout from "../../../layouts/Dashboard";
import { Container, Typography, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from "../../../auth/auth-provider";
import { PDS_COLLECTION_NS } from "../../../const";

export function ManageData() {
  const { pdsAgent } = useAuthContext()
  const [open, setOpen] = useState(false);
  const [operationRunning, setOperationRunning] = useState(false);
  const [noDataDialogOpen, setNoDataDialogOpen] = useState(false);

  const [sonaRecords, setSonaRecords] = useState<any[]>([])
  const loadSonaRecords = useCallback(async () => {
    const sonaRecords = await pdsAgent.com.atproto.repo.listRecords(
      {
        repo: pdsAgent.accountDid,
        collection: "app.sonasky.ref"
      }
    )
    setSonaRecords(sonaRecords.data.records)
  }, [pdsAgent])
  useEffect(() => {
    loadSonaRecords()
  }, [pdsAgent])

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleNoDataDialogClose = () => {
    setNoDataDialogOpen(false);
  };

  const handleDelete = () => {
    setOperationRunning(true);
    if (sonaRecords.length === 0) {
      setOperationRunning(false);
      setOpen(false);
      setNoDataDialogOpen(true);
    } else {
      sonaRecords.forEach(async (rec: { uri: string; }) => {
        await pdsAgent.com.atproto.repo.deleteRecord({
          repo: pdsAgent.assertDid,
          collection: PDS_COLLECTION_NS,
          rkey: rec.uri.split("/").pop() as string
        });
      })
      setTimeout(() => {
        location.reload(); // reload page
      }, 1000);
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Manage Data
        </Typography>
          {sonaRecords.length === 0 ? (
            <Typography variant="body1" gutterBottom>
              No SonaSky REF data found.
            </Typography>
          ) : (
            <Button variant="contained" color="error" onClick={handleClickOpen}>
              Clear SonaSky REF Data from Repo
            </Button>
          )}
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This is a non-reversible action that will delete all SonaSky REF data from your Bluesky account. Only use this if you are absolutely sure you'd like to delete your data. SonaSky does not keep any of your data - it all lives within your Bluesky account - so all this does is delete SonaSky REF data from your profile.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary" disabled={operationRunning}>
              Cancel
            </Button>
            <Button onClick={handleDelete} color="secondary" disabled={operationRunning} startIcon={operationRunning ? <CircularProgress size={20} /> : null}>
              {operationRunning ? 'Deleting...' : 'Delete Data'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={noDataDialogOpen} onClose={handleNoDataDialogClose}>
          <DialogTitle>No Data Found</DialogTitle>
          <DialogContent>
            <DialogContentText>
              No SonaSky REF data was found in your Bluesky account to delete.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleNoDataDialogClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
          {JSON.stringify(sonaRecords, null, 2)}
        </pre>
      </Container>
    </Layout>
  );
}
