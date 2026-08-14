import axios from "axios";
import type { BlogPost } from "@/types";

export const cmsAdminUrl = (import.meta.env.VITE_STRIPE_CMS_ADMIN_URL ??
  "") as string;

export const hasRemoteCms =
  Boolean(cmsAdminUrl) && /^https?:\/\//i.test(cmsAdminUrl);

export const getBlogPosts = async () => {
  const res = await axios.get<{ data: BlogPost[] }>(
    `${cmsAdminUrl}/api/posts?populate=*&sort=createdAt:desc`,
  );
  return res.data.data ?? [];
};

export const getBlogPlainText = (
  content: { children: { text: string }[] }[] | undefined,
) => {
  return (
    content
      ?.map((block) => block.children?.map((child) => child.text).join(" "))
      .join(" ") ?? ""
  );
};
