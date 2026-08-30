import { useEffect } from "react";
import { Button, Container, Skeleton } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ImageOff, RefreshCw } from "lucide-react";
import { BlogCard, EmptyState, ErrorState } from "@/components/shared";
import { buildCmsImageUrl } from "@/lib/utils";
import {
  cmsAdminUrl,
  getBlogPlainText,
  getBlogPosts,
  hasRemoteCms,
} from "@/lib/cms";

const PAGE_TITLE = "Nasze życie schroniska | Schronisko";

const BlogPage = () => {
  const {
    data: posts = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["posts", cmsAdminUrl],
    enabled: hasRemoteCms,
    queryFn: getBlogPosts,
  });

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);
  const featuredImageUrl = buildCmsImageUrl(featuredPost?.image?.[0]?.url);

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
            ) : isError ? (
              <ErrorState
                title="Wystąpił błąd"
                description={
                  <>
                    Wystąpił błąd podczas ładowania postów. <br /> Spróbuj
                    później ponownie.
                  </>
                }
              >
                <Button
                  variant="destructive"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw
                    className={isFetching ? "animate-spin" : undefined}
                    aria-hidden="true"
                  />
                  {isFetching ? "Ponawianie..." : "Spróbuj ponownie"}
                </Button>
              </ErrorState>
            ) : posts.length === 0 || !featuredPost ? (
              <EmptyState
                title="Brak postów"
                description={
                  <>
                    Nie ma jeszcze żadnych postów do wyświetlenia. <br /> Wróć
                    wkrótce, aby poznać historie z życia naszego schroniska.
                  </>
                }
              />
            ) : (
              <>
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="space-y-2 transition-colors hover:text-green-900 sm:col-span-2 lg:space-y-4"
                >
                  <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-gray-100">
                    {featuredImageUrl ? (
                      <img
                        src={featuredImageUrl}
                        alt={featuredPost.title}
                        width={1280}
                        height={720}
                        className="absolute size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <ImageOff
                        className="absolute size-10 object-cover text-gray-300 md:size-20"
                        aria-hidden="true"
                      />
                    )}
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
                      {getBlogPlainText(featuredPost.content)}
                    </p>
                  </div>
                </Link>
                {otherPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </>
            )}
          </div>
        </section>
      </Container>
    </main>
  );
};

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
      {Array.from({ length: 4 }).map((_, index) => (
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
