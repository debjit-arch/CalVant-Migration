import BlogPage from "@/static-pages/blog";

export default async function Posts({ params }) {
  const { slug } = await params;

  return <BlogPage slug={slug} />;
}