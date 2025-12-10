"use client";

import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Manually trigger hydration on the client side only
    useWorkflowStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  return <>{children}</>;
}
