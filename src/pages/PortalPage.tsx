import WytSaaSPortalLayout from '@/layouts/wytsaas/WytSaaSPortalLayout';
import WytPassPortalLayout from '@/layouts/wytpass/WytPassPortalLayout';

interface PortalPageProps {
  product: 'wytsaas' | 'wytpass';
}

export default function PortalPage({ product }: PortalPageProps) {
  if (product === 'wytpass') {
    return <WytPassPortalLayout onSelectProduct={() => { }} />;
  }
  return <WytSaaSPortalLayout onSelectProduct={() => { }} />;
}
