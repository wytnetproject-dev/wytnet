import { useState } from 'react';
import WytSaaSPortalLayout from '@/layouts/wytsaas/WytSaaSPortalLayout';
import WytPassPortalLayout from '@/layouts/wytpass/WytPassPortalLayout';

export default function PortalLayout() {
  const [activeProduct, setActiveProduct] = useState(() => {
    return localStorage.getItem('wytnet_active_product') || 'wytsaas';
  });

  const handleSelectProduct = (product: string) => {
    setActiveProduct(product);
    localStorage.setItem('wytnet_active_product', product);
  };

  if (activeProduct === 'wytpass') {
    return <WytPassPortalLayout onSelectProduct={handleSelectProduct} />;
  }

  return <WytSaaSPortalLayout onSelectProduct={handleSelectProduct} />;
}
