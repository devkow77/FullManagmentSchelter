import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Navbar, Footer, NavbarOnlyLayout } from "@/components/layout/shared";
import {
  HomePage,
  RegisterPage,
  LoginPage,
  AnimalsPage,
  TypeAnimalPage,
  FoundAnimalsPage,
  HowToHelp,
  FaqPage,
  ContactPage,
  TermsPage,
  PrivacyPage,
  BlogPage,
  NotFoundPage,
  BlogPostPage,
  NewsletterUnsubscribePage,
  FavouritesAnimalsPage,
  AnimalPage,
} from "@/pages";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui";
import { AuthProvider } from "./context/AuthContext";
import { AccountPage } from "./pages/client";
import {
  AdminAccountPage,
  AdminAnimalsPage,
  EditAnimalPage,
  AddAnimalPage,
  AdminWorkersPage,
  EditUserPage,
  AddUserPage,
  AdminAdoptionsPage,
  AdminVetsPage,
  AddVetPage,
  EditVetPage,
  AdminStatisticsPage,
  AdminCagesPage,
  AddCagePage,
  WorkWeekPage,
} from "./pages/admin";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import {
  WorkerUsersPage,
  EditAdoptionPage,
  MedicalRecordsPage,
  AddMedicalRecordPage,
  EditMedicalRecordPage,
  DailyAnimalNeedsPage,
  AnimalDemandsPage,
  AddDemandPage,
} from "./pages/worker";

const queryClient = new QueryClient();

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

const router = createBrowserRouter([
  // SCIEZKI OGÓLNE //
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/zwierzeta",
        element: <AnimalsPage />,
      },
      {
        path: "/zwierzeta/:id",
        element: <AnimalPage />,
      },
      {
        path: "/zwierzeta/psy",
        element: <TypeAnimalPage />,
      },
      {
        path: "/zwierzeta/koty",
        element: <TypeAnimalPage />,
      },
      {
        path: "/zwierzeta/kroliki",
        element: <TypeAnimalPage />,
      },
      {
        path: "/zwierzeta/króliki",
        element: <TypeAnimalPage />,
      },
      {
        path: "/znalezione-zwierzeta",
        element: <FoundAnimalsPage />,
      },
      {
        path: "/jak-pomoc",
        element: <HowToHelp />,
      },
      {
        path: "/faq",
        element: <FaqPage />,
      },
      {
        path: "/kontakt",
        element: <ContactPage />,
      },
      {
        path: "/regulamin",
        element: <TermsPage />,
      },
      {
        path: "/polityka-prywatnosci",
        element: <PrivacyPage />,
      },
      {
        path: "/blog",
        element: <BlogPage />,
      },
      {
        path: "/blog/:slug",
        element: <BlogPostPage />,
      },
      {
        path: "/newsletter/wypisz/:token",
        element: <NewsletterUnsubscribePage />,
      },
      {
        path: "/ulubione-zwierzeta",
        element: <FavouritesAnimalsPage />,
      },
    ],
  },
  {
    path: "/rejestracja",
    element: <RegisterPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
  // SCIEZKI UŻYTKOWNIKA //
  {
    element: (
      <ProtectedRoute requiredRole={["UZYTKOWNIK"]}>
        <NavbarOnlyLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/konto",
        element: <AccountPage />,
      },
    ],
  },
  // SCIEZKI ADMINISTRATORA //
  {
    element: (
      <ProtectedRoute requiredRole={["ADMINISTRATOR"]}>
        <NavbarOnlyLayout />
      </ProtectedRoute>
    ),
    path: "/admin",
    children: [
      {
        path: "/admin/konto",
        element: <AdminAccountPage />,
      },
      {
        path: "/admin/zwierzeta",
        element: <AdminAnimalsPage />,
      },
      {
        path: "/admin/zwierzeta/:id/edycja",
        element: <EditAnimalPage />,
      },
      {
        path: "/admin/zwierzeta/dodaj",
        element: <AddAnimalPage />,
      },
      {
        path: "/admin/pracownicy",
        element: <AdminWorkersPage />,
      },
      {
        path: "/admin/uzytkownicy/:id/edycja",
        element: <EditUserPage />,
      },
      {
        path: "/admin/uzytkownicy/dodaj",
        element: <AddUserPage />,
      },
      {
        path: "/admin/adopcje",
        element: <AdminAdoptionsPage />,
      },
      {
        path: "/admin/weterynarze",
        element: <AdminVetsPage />,
      },
      {
        path: "/admin/klatki",
        element: <AdminCagesPage />,
      },
      {
        path: "/admin/klatki/dodaj",
        element: <AddCagePage />,
      },
      {
        path: "/admin/weterynarze/dodaj",
        element: <AddVetPage />,
      },
      {
        path: "/admin/weterynarze/:id/edycja",
        element: <EditVetPage />,
      },
      {
        path: "/admin/statystyki",
        element: <AdminStatisticsPage />,
      },
      {
        path: "/admin/tydzien-pracy",
        element: <WorkWeekPage />,
      },
    ],
  },
  // SCIEZKI PRACOWNIKA I ADMINISTRATORA //
  {
    element: (
      <ProtectedRoute requiredRole={["ADMINISTRATOR", "PRACOWNIK"]}>
        <NavbarOnlyLayout />
      </ProtectedRoute>
    ),
    path: "/pracownik",
    children: [
      {
        path: "/pracownik/uzytkownicy",
        element: <WorkerUsersPage />,
      },
      {
        path: "/pracownik/adopcje/:id/edycja",
        element: <EditAdoptionPage />,
      },
      {
        path: "/pracownik/raporty-medyczne",
        element: <MedicalRecordsPage />,
      },
      {
        path: "/pracownik/raporty-medyczne/dodaj",
        element: <AddMedicalRecordPage />,
      },
      {
        path: "/pracownik/raporty-medyczne/:id/edycja",
        element: <EditMedicalRecordPage />,
      },
      {
        path: "/pracownik/codzienne-obowiazki",
        element: <DailyAnimalNeedsPage />,
      },
      {
        path: "/pracownik/zapotrzebowania-zwierzat",
        element: <AnimalDemandsPage />,
      },
      {
        path: "/pracownik/zapotrzebowania-zwierzat/dodaj",
        element: <AddDemandPage />,
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
