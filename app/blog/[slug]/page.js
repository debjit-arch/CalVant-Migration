import BlogPost from "@/static-pages/BlogPost";

export default function Posts({ params }) {
  return <BlogPost slug={params.slug} />;
}