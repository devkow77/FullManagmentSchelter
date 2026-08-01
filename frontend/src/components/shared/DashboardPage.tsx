import type { ReactNode } from "react";
import { Container } from "@/components/ui";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";

type DashboardPageProps = {
  title: string;
  description?: ReactNode;
  /** Element nad tytułem (np. badge statusu). */
  eyebrow?: ReactNode;
  showNavbar?: boolean;
  children: ReactNode;
};

const DashboardPage = ({
  title,
  description,
  eyebrow,
  showNavbar = true,
  children,
}: DashboardPageProps) => {
  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            {eyebrow != null && <div>{eyebrow}</div>}
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              {title}
            </h1>
            {description != null && (
              <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
                {description}
              </p>
            )}
          </div>
          {showNavbar && <DashboardNavbar />}
        </section>
        {children}
      </Container>
    </main>
  );
};

export default DashboardPage;
