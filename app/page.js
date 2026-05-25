import { getPageMetadata } from '@/utils/getPageMetadata';
import HomePageClient from '@/components/HomePageClient';

export async function generateMetadata() {
  const meta = await getPageMetadata('/', {
    title: 'CalVant | ISO Compliance & Risk Management Platform',
    description: 'Empower your organization with CalVant compliance platform.',
  });

  console.log('[generateMetadata] resolved:', JSON.stringify(meta, null, 2));
  return meta;
}

export default function Page() {
  return <HomePageClient />;
}