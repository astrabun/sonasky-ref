import { Container, Divider, List, ListItem, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { changelogData, latestVersion } from "../../../changelog"
import Layout from "../../../layouts/Dashboard"

function Changelog() {
  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          SonaSky REF Changelog
        </Typography>
        <Typography variant="h5">Current Version: {latestVersion.version}</Typography>
        <Typography variant="caption" gutterBottom>{latestVersion.date.format(`YYYY-MM-DD`)}</Typography>
        <List>
          {latestVersion.changes.map((change, index) => (
            <ListItem key={index}>{change}</ListItem>
          ))}
        </List>
        {changelogData.length > 1 && <Divider sx={{ marginTop: "1rem", marginBottom: "1rem" }} />}
        {changelogData.length > 1 && <Typography variant="h5" gutterBottom>Previous Versions</Typography>}
        {changelogData.filter(i => i.version !== latestVersion.version).map((version, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body1">
                Version {version.version} - {version.date.format(`YYYY-MM-DD`)}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {version.changes.map((change, idx) => (
                  <ListItem key={idx}>{change}</ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Layout>
  )
}

export default Changelog