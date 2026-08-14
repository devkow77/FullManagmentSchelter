/** Wpis blogowy pobierany z CMS-a (Strapi). */
export type BlogPost = {
  slug: string;
  title: string;
  content: { children: { text: string }[] }[];
  image: { url: string; formats?: { small?: { url: string } } }[];
  createdAt: string;
};
