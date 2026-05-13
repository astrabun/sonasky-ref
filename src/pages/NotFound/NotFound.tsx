import Layout from '../../layouts/Home';

function NotFound() {
    return (
        <Layout>
            <div style={{padding: '2rem', textAlign: 'center'}}>
                <h1>404 - Page Not Found</h1>
                <p>Sorry, the page you are looking for does not exist.</p>
            </div>
        </Layout>
    );
}

export default NotFound;
