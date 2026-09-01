import { Outlet } from 'react-router';
import Navbar from './Navbar';
import FooterSection from '../sections/FooterSection';

export default function Layout() {
  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh' }}>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <FooterSection />
    </div>
  );
}
