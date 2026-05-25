import dynamic from 'next/dynamic';
import { getPageMetadata } from '@/utils/getPageMetadata';

export async function generateMetadata() {
  return getPageMetadata('/privacy', {
    title: 'Privacy Policy | CalVant',
    description: 'CalVant privacy policy and data handling practices.',
    alternates: { canonical: 'https://main.d38cbxzpofbmee.amplifyapp.com/privacy' },
  });
}

const FooterContentPage = dynamic(() => import('@/footer-pages/FooterContentPage'), { ssr: false });

export default function Page() {
  return (
    <>
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        Privacy Policy | CalVant
      </h1>
      <FooterContentPage type="privacy" />
    </>
  );
}
