"use client";

import dynamic from 'next/dynamic';

const ChangePasswordModal = dynamic(() => import('@/modules/dashboard/ChangePasswordModal'), { ssr: false });

export default function ChangePassword() {
  return <ChangePasswordModal />;
}