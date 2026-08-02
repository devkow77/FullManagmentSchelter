import { Container } from "@/components/ui";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Skeleton } from "@/components/ui";

interface Post {
  slug: string;
  title: string;
  content: { children: { text: string }[] }[];
  image: { url: string }[];
  createdAt: string;
}

const cmsUrl = import.meta.env.VITE_STRIPE_CMS_ADMIN_URL;

const BlogPostPage = () => {
  const [post, setPost] = useState<Post>();
  const [loading, setLoading] = useState<boolean>(true);
  const [similiarPosts, setSimiliarPosts] = useState<Post[]>([]);

  const { slug } = useParams();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(
          `${cmsUrl}/api/posts?populate=*`,
        );

        const allPosts = res.data.data;

        const currentPost = allPosts.find((p: Post) => p.slug === slug);
        const similiarPosts = allPosts
          .filter((p: Post) => p.slug !== slug)
          .slice(0, 6);

        setPost(currentPost);
        setSimiliarPosts(similiarPosts);
      } catch (err) {
        console.error("Błąd pobierania posta", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} | Schronisko`;
    } else if (!loading) {
      document.title = "Post | Schronisko";
    }
  }, [post?.title, loading]);

  const postJsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: post.createdAt,
        image: post.image?.[0]?.url
          ? `${cmsUrl}${post.image[0].url}`
          : undefined,
        url: `/blog/${post.slug}`,
      }
    : null;

  if (loading) {
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
            id="similiarPosts"
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

  const calculateTimeReading = (text: string) => {
    const numberOfWords = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(numberOfWords / 100));
  };

  const getPlainText = (content: { children: { text: string }[] }[]) => {
    return content
      ?.map((block) =>
        block.children?.map((child: { text: string }) => child.text).join(" "),
      )
      .join(" ");
  };

  return (
    <main>
      {postJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }}
        />
      )}
      <Container className="space-y-12 md:space-y-16">
        <article
          id="post"
          aria-labelledby="blog-post-heading"
          className="space-y-6 gap-x-8 lg:flex lg:space-y-8"
        >
          <div className="relative mx-auto aspect-square max-h-100 flex-1 overflow-hidden rounded-full bg-black/20">
            {post?.image?.[0]?.url ? (
              <img
                src={`${cmsUrl}${post.image[0].url}`}
                alt={post.title}
                width={400}
                height={400}
                className="absolute size-full object-cover object-center"
              />
            ) : null}
          </div>
          <div className="flex-2 space-y-4">
            <h1
              id="blog-post-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              {post?.title}
            </h1>
            <ul
              aria-label="Informacje o poście"
              className="text-sm leading-6 font-medium md:text-base md:leading-7"
            >
              <li>
                Opublikowano{" "}
                {new Date(post?.createdAt as string).toLocaleDateString(
                  "pl-PL",
                )}{" "}
                r.
              </li>
              <li>
                Szacowany czas czytania:{" "}
                {calculateTimeReading(getPlainText(post?.content || []))} min
              </li>
            </ul>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              {getPlainText(post?.content || [])}
            </p>
          </div>
        </article>
        <section
          id="similiarPosts"
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
            {similiarPosts.map((similarPost: Post) => (
              <SwiperSlide key={similarPost.slug}>
                <Link
                  to={`/blog/${similarPost.slug}`}
                  className="space-y-2 transition-colors hover:text-green-900"
                >
                  <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-black/5">
                    {similarPost.image?.[0]?.url ? (
                      <img
                        src={`${cmsUrl}${similarPost.image[0].url}`}
                        alt={similarPost.title}
                        width={640}
                        height={360}
                        className="absolute size-full object-cover object-center"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold lg:text-lg">
                      {similarPost.title}
                    </h3>
                    <ul className="text-xs leading-6 font-medium md:text-sm md:leading-7">
                      <li>
                        Opublikowano{" "}
                        {new Date(
                          similarPost.createdAt as string,
                        ).toLocaleDateString("pl-PL")}{" "}
                        r.
                      </li>
                    </ul>
                    <p className="line-clamp-2 text-xs leading-5 lg:text-sm lg:leading-6">
                      {getPlainText(similarPost.content)}
                    </p>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
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
