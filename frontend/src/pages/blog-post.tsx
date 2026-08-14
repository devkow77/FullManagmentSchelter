import { useEffect } from "react";
import { Button, Container, Skeleton } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams, Link } from "react-router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { ImageOff, RefreshCw } from "lucide-react";
import { BlocksRenderer, type BlocksContent } from "@strapi/blocks-react-renderer";
import { ErrorState } from "@/components/shared";
import { buildCmsImageUrl } from "@/lib/utils";
import {
  cmsAdminUrl,
  getBlogPlainText,
  getBlogPosts,
  hasRemoteCms,
} from "@/lib/cms";

const calculateTimeReading = (text: string) => {
  const numberOfWords = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(numberOfWords / 100));
};

const BlogPostPage = () => {
  const { slug } = useParams();

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

  const post = posts.find((item) => item.slug === slug);
  const similarPosts = posts.filter((item) => item.slug !== slug).slice(0, 6);
  const postImageUrl = buildCmsImageUrl(post?.image?.[0]?.url);
  const postPlainText = getBlogPlainText(post?.content);

  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} | Schronisko`;
    }
  }, [post?.title]);

  if (isLoading) {
    return (
      <main>
        <Container className="space-y-12 md:space-y-16">
          <section
            id="post"
            className="space-y-6 gap-x-8 lg:flex lg:space-y-8"
            aria-hidden="true"
          >
            <Skeleton className="relative mx-auto aspect-square max-h-100 flex-1 rounded-full" />
            <div className="flex-2 space-y-4">
              <Skeleton className="h-15 w-70 sm:w-100" />
              <ul className="space-y-4">
                <Skeleton className="h-7.5 w-60" />
                <Skeleton className="h-7.5 w-70" />
              </ul>
              <Skeleton className="h-300 w-full" />
            </div>
          </section>
          <section
            id="similarPosts"
            className="hidden space-y-6 md:block lg:space-y-8"
            aria-hidden="true"
          >
            <Skeleton className="h-15 w-100" />
            <div className="flex gap-x-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex-1 space-y-4">
                  <Skeleton className="h-50 w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-7.5 w-20" />
                    <Skeleton className="h-7.5 w-60" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Container>
      </main>
    );
  }

  if (isError) {
    return (
      <main>
        <Container className="space-y-12 md:space-y-16">
          <ErrorState
            title="Wystąpił błąd"
            description="Wystąpił błąd podczas ładowania posta. Odśwież stronę lub spróbuj później."
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
        </Container>
      </main>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const postJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.createdAt,
    image: postImageUrl,
    url: `/blog/${post.slug}`,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }}
      />
      <Container className="space-y-12 md:space-y-16">
        <article
          id="post"
          aria-labelledby="blog-post-heading"
          className="space-y-6 gap-x-8 lg:flex lg:space-y-8"
        >
          <div className="relative mx-auto grid aspect-square max-h-100 flex-1 place-items-center overflow-hidden rounded-full bg-black/20">
            {postImageUrl ? (
              <img
                src={postImageUrl}
                alt={post.title}
                width={400}
                height={400}
                className="absolute size-full object-cover object-center"
              />
            ) : (
              <ImageOff
                className="size-10 text-gray-300 md:size-20"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="flex-2 space-y-4">
            <h1
              id="blog-post-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              {post.title}
            </h1>
            <ul
              aria-label="Informacje o poście"
              className="text-sm leading-6 font-medium md:text-base md:leading-7"
            >
              <li>
                Opublikowano {new Date(post.createdAt).toLocaleDateString("pl-PL")}{" "}
                r.
              </li>
              <li>
                Szacowany czas czytania: {calculateTimeReading(postPlainText)}{" "}
                min
              </li>
            </ul>
            <div className="space-y-4 text-sm leading-6 md:text-base md:leading-7 [&_a]:text-green-800 [&_a]:underline [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
              <BlocksRenderer content={post.content as BlocksContent} />
            </div>
          </div>
        </article>
        <section
          id="similarPosts"
          aria-labelledby="similar-posts-heading"
          className="space-y-6 lg:space-y-8"
        >
          <h2
            id="similar-posts-heading"
            className="text-2xl font-bold text-green-900 md:text-4xl"
          >
            Podobne posty
          </h2>
          <Swiper
            spaceBetween={24}
            slidesPerView={1.1}
            grabCursor
            modules={[Pagination]}
            pagination={{ clickable: true }}
            breakpoints={{
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
          >
            {similarPosts.map((similarPost) => {
              const similarImageUrl = buildCmsImageUrl(
                similarPost.image?.[0]?.url,
              );

              return (
                <SwiperSlide key={similarPost.slug}>
                  <Link
                    to={`/blog/${similarPost.slug}`}
                    className="space-y-2 transition-colors hover:text-green-900"
                  >
                    <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-black/5">
                      {similarImageUrl ? (
                        <img
                          src={similarImageUrl}
                          alt={similarPost.title}
                          width={640}
                          height={360}
                          className="absolute size-full object-cover object-center"
                        />
                      ) : (
                        <ImageOff
                          className="absolute size-10 object-cover text-gray-300 md:size-20"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold lg:text-lg">
                        {similarPost.title}
                      </h3>
                      <ul className="text-xs leading-6 font-medium md:text-sm md:leading-7">
                        <li>
                          Opublikowano{" "}
                          {new Date(similarPost.createdAt).toLocaleDateString(
                            "pl-PL",
                          )}{" "}
                          r.
                        </li>
                      </ul>
                      <p className="line-clamp-2 text-xs leading-5 lg:text-sm lg:leading-6">
                        {getBlogPlainText(similarPost.content)}
                      </p>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
            <SwiperSlide>
              <Link
                to="/blog"
                aria-label="Zobacz wszystkie posty"
                className="space-y-2 transition-colors hover:text-green-900"
              >
                <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-green-900">
                  <span className="text-xl font-semibold text-white lg:text-3xl">
                    Wszystkie
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold lg:text-lg">
                    Zobacz wszystkie posty
                  </h3>
                  <p className="line-clamp-2 text-xs leading-5 lg:text-sm lg:leading-6">
                    Przejrzyj pełną listę naszych akcji i aktualności ze
                    schroniska.
                  </p>
                </div>
              </Link>
            </SwiperSlide>
          </Swiper>
        </section>
      </Container>
    </main>
  );
};

export default BlogPostPage;
