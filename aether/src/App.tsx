import Navbar from './components/Navbar';
import PageLoader from './components/PageLoader';
import HeroSection from './components/HeroSection';
import IntroSection from './components/IntroSection';
import ProcessSection from './components/ProcessSection';
import CapabilitiesSection from './components/CapabilitiesSection';
import ProjectsSection from './components/ProjectsSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <div className="grain-overlay" />
      <PageLoader />
      <Navbar />
      <HeroSection />
      <IntroSection />
      <ProcessSection />
      <CapabilitiesSection />
      <ProjectsSection />
      <ContactSection />
      <Footer />
    </>
  );
}
