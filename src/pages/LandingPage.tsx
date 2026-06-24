import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import Ecosystem from '@/components/landing/Ecosystem';
import Orchestration from '@/components/landing/Orchestration';
import CTA from '@/components/landing/CTA';
import EnquirySection from '@/components/landing/EnquirySection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfe]/30 selection:bg-wytnet-blue/10 selection:text-wytnet-blue">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Stats />
        <Ecosystem />
        <Orchestration />
        <CTA />
        <EnquirySection />
      </main>
      <Footer />
    </div>
  );
}
