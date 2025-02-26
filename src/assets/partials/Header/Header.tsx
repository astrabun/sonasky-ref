import { Link, useLocation } from "react-router";
import { useState } from "react";

interface HeaderProps {
  hideNavigation?: boolean;
}

function Header({ hideNavigation }: HeaderProps) {
  const location = useLocation();
  const [imgError, setImgError] = useState(false);
  const pages = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <header style={{ padding: '1rem' }}>
      {imgError ? (
        <h1 style={{ textAlign: 'center' }}>Sonasky REF</h1>
      ) : (
        <img 
          src="/img/sonasky_ref_draft_logo_dark.png" 
          alt="Sonasky REF" 
          style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }} 
          onError={() => setImgError(true)}
        />
      )}
      {!hideNavigation && (
        <nav style={{ display: 'flex', justifyContent: 'center' }}>
          {pages.map((page) => (
            <Link 
              key={page.path} 
              to={page.path} 
              style={{ 
                margin: '0 1rem', 
                color: 'inherit', 
                textDecoration: location.pathname === page.path ? 'underline' : 'none' 
              }}
            >
              {page.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

export default Header;