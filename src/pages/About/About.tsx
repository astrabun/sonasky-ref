import Layout from '../../layouts/Home';
import './About.css';

export function About() {
  return (
    <Layout>
      <div style={{ textAlign: "justify", padding: '2rem' }}>
        <h1>About SonaSky REF</h1>
        <p>SonaSky REF was created as an extension/continuation of <a className="no-visited" target="_blank" href="https://sonasky.app">SonaSky</a>, a self-serve Bluesky labeller service providing furry-related Bluesky labels.</p>
        <p>Furries on Bluesky seem to enjoy being able to show off their species on their profile. Two of the main difficulties involved with SonaSky as a label-only service are: </p>
        <p style={{ paddingLeft: "1rem" }}>1) ensuring there is a label that works for every single user, and </p>
        <p style={{ paddingLeft: "1rem" }}>2) providing enough detail without oversaturating the timeline view of others.</p>
        <p>The former is a problem that SonaSky has encountered often; Bluesky labelers have a max payload size they are allowed to use, which means the label definitions are not infinite. To put a bandaid on the problem, SonaSky created a second labeller dedicated specifically to Pokemon-based labels to make room for more furry species on the primary labeller. However, as more labels are added, this problem occurs again and again until labels are removed. On the latter point, while SonaSky never imposed limits on how many labels any given user could apply to their own profile, some users took this to an extreme. While likely well-intentioned (to show as much detail on their character(s) as possible), this creates a poor user experience for others who see their profile on Bluesky - creating a mountain of labels below any post they make.</p>
        <p>SonaSky REF attempts to bridge the gap for both of these problems. SonaSky REF allows Bluesky users to store information about one or more of their characters (fursonas, OCs, theriotypes, etc.) as AT Protocol records within their user repo, so the data is stored alongside their Bluesky account. This allows custom data to be added to the profile for highly specific use cases (e.g., custom species with only a handful of users, species that aren't necessarily furry-adjacent, and other reasons label requests have been rejected in the past for the SonaSky labeller).</p>
        <p>Thank you for checking out SonaSky REF. I hope you find this tool interesting and helpful in showcasing your characters on Bluesky.</p>
      </div>
    </Layout>
  );
}
