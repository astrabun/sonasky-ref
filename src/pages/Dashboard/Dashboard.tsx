import Layout from "../../layouts/Dashboard";
import { Container, Typography } from '@mui/material';

function Dashboard() {
  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" gutterBottom>
          Welcome to the Dashboard!
        </Typography>
        <Typography variant="body1" gutterBottom>
          This is where you will manage your characters and data. Use the navigation on the left to get started.
        </Typography>
      </Container>
    </Layout>
  );
}

export default Dashboard;
