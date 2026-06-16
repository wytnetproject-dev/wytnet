import Header from '@/components/landing/Header';
import Marketplace from '@/components/marketplace/Marketplace';
import Footer from '@/components/landing/Footer';

interface MarketplacePageProps {
  currentHash: string;
}

export default function MarketplacePage({ currentHash }: MarketplacePageProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfe]/30 selection:bg-wytnet-blue/10 selection:text-wytnet-blue">
      <Header />
      <main className="flex-grow">
        <Marketplace currentHash={currentHash} />
      </main>
      <Footer />
    </div>
  );
}
