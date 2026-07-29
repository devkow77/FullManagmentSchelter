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

const BlogPostPage = () => {
  const [post, setPost] = useState<Post>();
  const [loading, setLoading] = useState<boolean>(true);
  const [similiarPosts, setSimiliarPosts] = useState<Post[]>([]);

  const { slug } = useParams();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_STRIPE_CMS_ADMIN_URL}/api/posts?populate=*`,
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

  if (loading) {
    return (
      <main>
        <Container className="space-y-12 md:space-y-16">
          <section id="post" className="space-y-6 gap-x-8 lg:flex lg:space-y-8">
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
      <Container className="space-y-12 md:space-y-16">
        <section id="post" className="space-y-6 gap-x-8 lg:flex lg:space-y-8">
          <div className="relative mx-auto aspect-square max-h-100 flex-1 overflow-hidden rounded-full bg-black/20">
            <img
              src={`http://localhost:1337${post?.image[0].url}`}
              alt={post?.title}
              className="absolute size-full object-cover object-center"
            />
          </div>
          <div className="flex-2 space-y-4">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              {post?.title}
            </h1>
            <ul className="text-sm leading-6 font-medium md:text-base md:leading-7">
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
        </section>
        <section id="similiarPosts" className="space-y-6 lg:space-y-8">
          <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
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
            {similiarPosts.map((post: Post, index) => (
              <SwiperSlide key={index}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="space-y-2 transition-colors hover:text-green-900"
                >
                  <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-black/5">
                    <img
                      src={`http://localhost:1337${post?.image[0].url}`}
                      alt={post?.title}
                      className="absolute size-full object-cover object-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold lg:text-lg">{post.title}</h3>
                    <ul className="text-xs leading-6 font-medium md:text-sm md:leading-7">
                      <li>
                        Opublikowano{" "}
                        {new Date(post?.createdAt as string).toLocaleDateString(
                          "pl-PL",
                        )}{" "}
                        r.
                      </li>
                    </ul>
                    <p className="line-clamp-2 text-xs leading-5 lg:text-sm lg:leading-6">
                      {getPlainText(post.content)}
                    </p>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
            <SwiperSlide>
              <Link
                to="/blog"
                className="space-y-2 transition-colors hover:text-green-900"
              >
                <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-green-900">
                  <h3 className="text-xl font-semibold text-white lg:text-3xl">
                    Wszystkie
                  </h3>
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
