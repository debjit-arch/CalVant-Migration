import dynamic from 'next/dynamic';
import { getPageMetadata } from '@/utils/getPageMetadata';

export async function generateMetadata() {
  return getPageMetadata('/terms', {
    title: 'Terms of Service | CalVant',
    description: 'CalVant terms of service and usage policies.',
    alternates: { canonical: 'https://main.d38cbxzpofbmee.amplifyapp.com/terms' },
  });
}

const FooterContentPage = dynamic(() => import('@/footer-pages/FooterContentPage'), { ssr: false });

export default function Page() {
  return (
    <>
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        Terms of Service | CalVant
      </h1>
      <FooterContentPage type="terms" />
    </>
  );
}
