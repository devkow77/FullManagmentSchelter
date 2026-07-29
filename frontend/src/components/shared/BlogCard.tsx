import { Link } from "react-router";
import { ImageOff } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  content: { children: { text: string }[] }[];
  image: { url: string; formats?: { small?: { url: string } } }[];
  createdAt: string;
}

const BlogCard = ({ post }: { post: BlogPost }) => {
  const cmsUrl = import.meta.env.VITE_STRIPE_CMS_ADMIN_URL;
  const imagePath =
    post.image?.[0]?.formats?.small?.url ?? post.image?.[0]?.url;

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="space-y-2 transition-colors duration-200 hover:text-green-900"
    >
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-gray-100">
        {imagePath ? (
          <img
            src={`${cmsUrl}${imagePath}`}
            alt={post.title}
            className="absolute size-full object-cover"
          />
        ) : (
          <ImageOff className="absolute size-10 object-cover text-gray-300 md:size-20" />
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold lg:text-lg">{post.title}</h3>
        <p className="line-clamp-4 text-xs leading-5 font-medium sm:text-sm lg:leading-6">
          Opublikowano {new Date(post.createdAt).toLocaleDateString("pl-PL")} r.
        </p>
        <p className="line-clamp-4 text-xs leading-5 lg:text-sm lg:leading-6">
          {post.content[0].children[0].text}
        </p>
      </div>
    </Link>
  );
};

export default BlogCard;
