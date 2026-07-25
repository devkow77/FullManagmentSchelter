"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router";

const dotVariants: Variants = {
  closed: () => ({
    y: 0,
    scale: 1,
  }),
  open: (custom: number) => ({
    y: custom,
    scale: custom === 0 ? 2 : 1,
  }),
  hover: (custom: number) => ({
    y: custom * 1.2,
    scale: custom === 0 ? 2.2 : 1.1,
    transition: { duration: 0.2 },
  }),
};

const HamburgerButton = ({
  isOpen,
  onClick,
  className,
}: {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}) => (
  <motion.div
    onClick={onClick}
    className={className}
    animate={isOpen ? "open" : "closed"}
    whileHover="hover"
  >
    <motion.div
      custom={9}
      variants={dotVariants}
      className="h-1.5 w-1.5 rounded-full bg-black dark:bg-white"
      transition={{ duration: 0.3 }}
    />
    <motion.div
      custom={0}
      variants={dotVariants}
      className="h-1.5 w-1.5 rounded-full bg-black dark:bg-white"
      transition={{ duration: 0.3 }}
    />
    <motion.div
      custom={-9}
      variants={dotVariants}
      className="h-1.5 w-1.5 rounded-full bg-black dark:bg-white"
      transition={{ duration: 0.3 }}
    />
  </motion.div>
);

const animalLinks = [
  { title: "Psy", href: "/zwierzeta/psy" },
  { title: "Koty", href: "/zwierzeta/koty" },
  { title: "Króliki", href: "/zwierzeta/kroliki" },
  { title: "Inne zwierzęta", href: "/zwierzeta" },
] as const;

const Hamburger = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAnimalsOpen, setIsAnimalsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverflow: documentElement.style.overflow,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      documentElement.style.overflow = previous.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const handleClick = (): void => {
    setIsOpen((prev) => !prev);
    if (isOpen) setIsAnimalsOpen(false);
  };

  const closeMenu = (): void => {
    setIsOpen(false);
    setIsAnimalsOpen(false);
  };

  const toggleAnimals = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setIsAnimalsOpen((prev) => !prev);
  };

  return (
    <>
      {!isOpen ? (
        <HamburgerButton
          isOpen={false}
          onClick={handleClick}
          className="flex cursor-pointer flex-col gap-1 p-4 xl:hidden"
        />
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-none bg-white dark:bg-black dark:text-white xl:hidden">
          <HamburgerButton
            isOpen
            onClick={handleClick}
            className="absolute top-6 right-6 flex cursor-pointer flex-col gap-1 p-4"
          />
          <ul className="space-y-6 text-center font-medium">
            <li>
              <Link to="/" onClick={closeMenu}>
                Strona główna
              </Link>
            </li>
            <li className="space-y-4">
              <button
                onClick={toggleAnimals}
                className="flex w-full items-center justify-center"
              >
                Zarządzanie zwierzętami{" "}
                {isAnimalsOpen ? <ChevronUp /> : <ChevronDown />}
              </button>
              {isAnimalsOpen ? (
                <ul className="space-y-4">
                  {animalLinks.map(({ title, href }) => (
                    <li key={href}>
                      <Link to={href} onClick={closeMenu}>
                        {title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
            <li>
              <Link to="/blog" onClick={closeMenu}>
                Blog
              </Link>
            </li>
            <li>
              <Link to="/faq" onClick={closeMenu}>
                Faq
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </>
  );
};

export default Hamburger;
