// src/app/resort_owner/layout.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { requireAuth } from '../lib/auth';

export default function ResortOwnerLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    if (!requireAuth(router, 'resort_owner')) return;
  }, [router]);

  return (
    // ❌ Энд Header БҮҮ хий
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}