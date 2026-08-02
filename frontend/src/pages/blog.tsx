import { useEffect } from "react";
import { Container, Skeleton } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CircleAlert, Info } from "lucide-react";
import { Link } from "react-router";
import { BlogCard } from "@/components/shared";

interface Post {
  slug: string;
  title: string;
  content: { children: { text: string }[] }[];
  image: { url: string }[];
  createdAt: string;
}

const PAGE_TITLE = "Nasze życie schroniska | Schronisko";
const cmsUrl = import.meta.env.VITE_STRIPE_CMS_ADMIN_URL;

const BlogPage = () => {
  const getPosts = async () => {
    const res = await axios.get<{ data: Post[] }>(
      `${cmsUrl}/api/posts?populate=*`,
    );
    return res.data.data ?? [];
  };

  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["posts"],
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
            {isLoading && <LoadingBlog />}
            {error && <ErrorBlog />}
            {!isLoading && !error && posts.length === 0 && <EmptyBlog />}
            {!isLoading && !error && featuredPost && (
              <>
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="space-y-2 transition-colors hover:text-green-900 sm:col-span-2 lg:space-y-4"
                >
                  <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-100">
                    {featuredPost.image?.[0]?.url ? (
                      <img
                        src={`${cmsUrl}${featuredPost.image[0].url}`}
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
                {otherPosts.map((post: Post) => (
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

// UI podczas braku postów
const EmptyBlog = () => {
  return (
    <div
      role="status"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-xl border border-blue-200 bg-blue-50 px-6 py-12 text-center"
    >
      <Info className="size-12 text-blue-600" aria-hidden="true" />
      <div className="space-y-2">
        <p className="text-xl font-semibold text-blue-900">Brak postów</p>
        <p className="max-w-md text-sm text-blue-800 md:text-base">
          Nie ma jeszcze żadnych postów do wyświetlenia. <br /> Wróć wkrótce,
          aby poznać historie z życia naszego schroniska.
        </p>
      </div>
    </div>
  );
};

// UI podczas wystąpienia błędu podczas ładowania postów
const ErrorBlog = () => {
  return (
    <div
      role="alert"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" aria-hidden="true" />
      <div className="space-y-2">
        <p className="text-lg font-semibold text-red-900 md:text-xl">
          Wystapił błąd
        </p>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił błąd podczas ładowania postów. <br /> Spróbuj później
          ponownie.
        </p>
      </div>
    </div>
  );
};

export default BlogPage;
