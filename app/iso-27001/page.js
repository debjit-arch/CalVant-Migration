import dynamic from 'next/dynamic';
import { getPageMetadata } from '@/utils/getPageMetadata';

export async function generateMetadata() {
  return getPageMetadata('/iso-27001', {
    title: 'ISO 27001 Compliance | CalVant',
    description: 'Streamline your ISO 27001 certification journey with CalVant.',
    alternates: { canonical: 'https://main.d38cbxzpofbmee.amplifyapp.com/iso-27001' },
  });
}

const ISO_27001 = dynamic(() => import('@/modules/dashboard/FrameWorks/ISO_27001'), { ssr: false });

export default function Page() {
  return (
    <>
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        ISO 27001 Compliance | CalVant
      </h1>
      <ISO_27001 />
    </>
  );
}
