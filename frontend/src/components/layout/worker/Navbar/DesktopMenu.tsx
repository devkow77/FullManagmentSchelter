"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui";
import { Link, useLocation } from "react-router";
import { styleActiveLink } from "@/lib/utils";
import { Heart } from "lucide-react";

interface Animal {
  title: string;
  href: string;
  description: string;
}

const animals: Animal[] = [
  {
    title: "Psy",
    href: "/zwierzeta/psy",
    description:
      "Tutaj znajdziesz wiernych i lojalnych towarzyszy, gotowych na wspólne przygody.",
  },
  {
    title: "Koty",
    href: "/zwierzeta/koty",
    description:
      "Odkryj niezależne i pełne wdzięku stworzenia, które wniosą radość do Twojego życia.",
  },
  {
    title: "Króliki",
    href: "/zwierzeta/kroliki",
    description:
      "Poznaj urocze i delikatne króliki, które są idealnymi towarzyszami dla całej rodziny.",
  },
  {
    title: "Wszystkie",
    href: "/zwierzeta",
    description:
      "Znajdź różnorodne zwierzęta, które czekają na kochający dom i nowe przygody.",
  },
];

const DesktopMenu = () => {
  const pathname = useLocation().pathname;

  return (
    <NavigationMenu viewport={false} className="z-50 hidden xl:block">
      <NavigationMenuList className="space-x-2">
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/" className={styleActiveLink(pathname, "/")}>
              Strona główna
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Zwierzęta</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-75 gap-4">
              {animals.length
                ? animals.map(({ title, href, description }, index) => (
                    <NavigationMenuLink asChild key={index}>
                      <Link
                        to={href}
                        className={`flex flex-col items-start bg-transparent ${styleActiveLink(pathname, href)}`}
                      >
                        <div>{title}</div>
                        <div className="text-muted-foreground">
                          {description}
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  ))
                : null}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to="/znalezione-zwierzeta"
              className={styleActiveLink(pathname, "/znalezione-zwierzeta")}
            >
              Znalezione
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to="/jak-pomoc"
              className={styleActiveLink(pathname, "/jak-pomoc")}
            >
              Jak pomóc?
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/blog" className={styleActiveLink(pathname, "/blog")}>
              Blog
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/faq" className={styleActiveLink(pathname, "/faq")}>
              Faq
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/pracownik/konto" className="font-medium text-blue-800">
              Panel Pracownika
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/ulubione-zwierzeta" className="font-medium text-red-600">
              <Heart className="size-4 fill-red-600 text-red-600" /> Ulubione
              zwierzęta
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default DesktopMenu;
