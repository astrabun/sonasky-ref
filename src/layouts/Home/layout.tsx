import { Container } from '@mui/material';
import React from 'react';
import Header from '../../assets/partials/Header';

interface LayoutProps {
  children?: React.ReactNode;
}
function Layout(props: LayoutProps) {
  const { children } = {...props};
  return (
    <>
      <Container>
        <Header />
        { children }
      </Container>
    </>
  )
}

export default Layout