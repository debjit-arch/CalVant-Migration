import dynamic from 'next/dynamic';
import { getPageMetadata } from '@/utils/getPageMetadata';

export async function generateMetadata() {
  return getPageMetadata('/iso-27701', {
    title: 'ISO 27701 Compliance | CalVant',
    description: 'Privacy Information Management with ISO 27701 on CalVant.',
    alternates: { canonical: 'https://main.d38cbxzpofbmee.amplifyapp.com/iso-27701' },
  });
}

const ISO_27701 = dynamic(() => import('@/modules/dashboard/FrameWorks/ISO_27701'), { ssr: false });

export default function Page() {
  return (
    <>
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        ISO 27701 Compliance | CalVant
      </h1>
      <ISO_27701 />
    </>
  );
}
