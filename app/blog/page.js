import dynamic from 'next/dynamic';
import { getPageMetadata } from '@/utils/getPageMetadata';

export async function generateMetadata() {
  return getPageMetadata('/blog', {
    title: 'Compliance & Security Blog | CalVant',
    description: 'Latest insights on compliance, security and data privacy from CalVant.',
    alternates: { canonical: 'https://main.d38cbxzpofbmee.amplifyapp.com/blog' },
  });
}

const BlogPage = dynamic(() => import('@/static-pages/blog'), { ssr: false });

export default function Page() {
  return (
    <>
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        Compliance & Security Blog | CalVant
      </h1>
      <BlogPage />
    </>
  );
}
