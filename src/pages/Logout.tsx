import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthContext } from '../auth/auth-provider';

function Logout() {
  const { signOut } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    signOut();
  }, [signOut, navigate]);

  return null;
}

export default Logout;
