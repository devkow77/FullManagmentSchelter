"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui";
import { ChartNoAxesColumnIncreasing, Heart } from "lucide-react";
import { styleActiveLink } from "@/lib/utils";
import { Link, useLocation } from "react-router";

const DesktopMenu = () => {
  const pathname = useLocation().pathname;
  return (
    <NavigationMenu viewport={false} className="z-10 hidden xl:block">
      <NavigationMenuList className="space-x-2">
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to="/pracownik/konto"
              className={styleActiveLink(pathname, "/pracownik/konto")}
            >
              Panel Pracownika
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to="/pracownik/zwierzeta"
              className={styleActiveLink(pathname, "/pracownik/zwierzeta")}
            >
              Zwierzęta
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to="/pracownik/adopcje"
              className={styleActiveLink(pathname, "/pracownik/adopcje")}
            >
              Wnioski adopcyjne
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to="/pracownik/klienci"
              className={styleActiveLink(pathname, "/pracownik/klienci")}
            >
              Klienci
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to="/pracownik/raporty"
              className={styleActiveLink(pathname, "/pracownik/raporty")}
            >
              Raporty <ChartNoAxesColumnIncreasing />
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to="/pracownik/wiadomosci"
              className={styleActiveLink(pathname, "/pracownik/wiadomosci")}
            >
              Wiadomości
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/ulubione-zwierzeta" className="font-medium text-red-600">
              <Heart className="size-4 fill-red-600 text-red-600" /> Ulubione
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default DesktopMenu;
