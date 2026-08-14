import { useEffect } from "react";
import { Container, Skeleton } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router";
import { BlogCard, EmptyState, ErrorState } from "@/components/shared";
import { buildCmsImageUrl } from "@/lib/utils";
import type { BlogPost } from "@/types";

const PAGE_TITLE = "Nasze życie schroniska | Schronisko";
const cmsUrl = import.meta.env.VITE_STRIPE_CMS_ADMIN_URL as string | undefined;
const hasRemoteCms = Boolean(cmsUrl) && /^https?:\/\//i.test(cmsUrl!);

const BlogPage = () => {
  const getPosts = async () => {
    const res = await axios.get<{ data: BlogPost[] }>(
      `${cmsUrl}/api/posts?populate=*`,
    );
    return res.data.data ?? [];
  };

  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["posts", cmsUrl],
    enabled: hasRemoteCms,
    queryFn: getPosts,
  });

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  const blogJsonLd =
    posts.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Nasze życie schroniska",
          numberOfItems: posts.length,
          itemListElement: posts.map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: post.title,
            url: `/blog/${post.slug}`,
          })),
        }
      : null;

  const getPlainText = (content: { children: { text: string }[] }[]) => {
    return content
      ?.map((block) =>
        block.children?.map((child: { text: string }) => child.text).join(" "),
      )
      .join(" ");
  };

  return (
    <main>
      {blogJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
        />
      )}
      <Container className="space-y-12 md:space-y-16">
        <section
          id="blog"
          aria-labelledby="blog-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h1
              id="blog-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              Nasze życie schroniska
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Poznaj codzienne życie naszego schroniska, historie podopiecznych
              i ciekawostki ze świata zwierząt.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6">
            {isLoading ? (
              <LoadingBlog />
            ) : error ? (
              <ErrorState
                title="Wystąpił błąd"
                description={
                  <>
                    Wystąpił błąd podczas ładowania postów. <br /> Spróbuj
                    później ponownie.
                  </>
                }
              />
            ) : posts.length === 0 ? (
              <EmptyState
                title="Brak postów"
                description={
                  <>
                    Nie ma jeszcze żadnych postów do wyświetlenia. <br /> Wróć
                    wkrótce, aby poznać historie z życia naszego schroniska.
                  </>
                }
              />
            ) : featuredPost ? (
              <>
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="space-y-2 transition-colors hover:text-green-900 sm:col-span-2 lg:space-y-4"
                >
                  <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-100">
                    {featuredPost.image?.[0]?.url ? (
                      <img
                        src={buildCmsImageUrl(featuredPost.image[0].url)}
                        alt={featuredPost.title}
                        width={1280}
                        height={720}
                        className="absolute size-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <h2 className="font-semibold sm:text-lg lg:text-2xl">
                      {featuredPost.title}
                    </h2>
                    <p className="line-clamp-4 text-xs leading-5 font-medium sm:text-sm lg:leading-6">
                      Opublikowano{" "}
                      {new Date(featuredPost.createdAt).toLocaleDateString(
                        "pl-PL",
                      )}{" "}
                      r.
                    </p>
                    <p className="line-clamp-3 text-xs leading-5 sm:text-sm sm:leading-6">
                      {getPlainText(featuredPost.content)}
                    </p>
                  </div>
                </Link>
                {otherPosts.map((post: BlogPost) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </>
            ) : null}
          </div>
        </section>
      </Container>
    </main>
  );
};

// UI podczas ładowania postów
const LoadingBlog = () => {
  return (
    <>
      <div className="space-y-4 sm:col-span-2" aria-hidden="true">
        <Skeleton className="relative aspect-video" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-60 md:w-80" />
          <Skeleton className="h-7.5 w-40 md:w-60" />
          <Skeleton className="h-10 w-70 md:w-140" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, index: number) => (
        <div key={index} className="space-y-4" aria-hidden="true">
          <Skeleton className="relative aspect-video" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-60" />
            <Skeleton className="h-7.5 w-40" />
            <Skeleton className="h-10 w-70 md:w-full" />
          </div>
        </div>
      ))}
    </>
  );
};

export default BlogPage;
