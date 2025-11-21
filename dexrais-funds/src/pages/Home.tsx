import Hero from '../components/Landing/Hero';
import Footer from '../components/Landing/Footer';
import SplitAuthModal from '../components/Auth/SplitAuthModal';
import CookieBanner from '../components/CookieBanner';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { showAuth, authMode, closeAuth } = useAuth();

  return (
    <div className="min-h-screen">
      <Hero />
      <Footer />

      {/* Auth Modal */}
      <SplitAuthModal
        isOpen={showAuth}
        onClose={closeAuth}
        defaultMode={authMode}
      />

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
