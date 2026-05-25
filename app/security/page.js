//app/security/page.js

import dynamic from 'next/dynamic';
import { getPageMetadata } from '@/utils/getPageMetadata';

export async function generateMetadata() {
  return getPageMetadata('/security', {
    title: 'Security | CalVant',
    description: 'How CalVant keeps your data secure.',
    alternates: { canonical: 'https://main.d38cbxzpofbmee.amplifyapp.com/security' },
  });
}

const FooterContentPage = dynamic(() => import('@/footer-pages/FooterContentPage'), { ssr: false });

export default function Page() {
  return (
    <>
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        Security | CalVant
      </h1>
      <FooterContentPage type="security" />
    </>
  );
}
