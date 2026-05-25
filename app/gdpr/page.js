import dynamic from 'next/dynamic';
import { getPageMetadata } from '@/utils/getPageMetadata';

export async function generateMetadata() {
  return getPageMetadata('/gdpr', {
    title: 'GDPR Compliance | CalVant',
    description: 'Achieve GDPR compliance with CalVant automated tools and frameworks.',
    alternates: { canonical: 'https://main.d38cbxzpofbmee.amplifyapp.com/gdpr' },
  });
}

const GDPR = dynamic(() => import('@/modules/dashboard/FrameWorks/GDPR'), { ssr: false });

export default function Page() {
  return (
    <>
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        GDPR Compliance | CalVant
      </h1>
      <GDPR />
    </>
  );
}
