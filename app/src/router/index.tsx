/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout/MainLayout";
import { learningRoutes } from "@/data/moduleCatalog";

const HomePage = lazy(async () => ({
  default: (await import("@/pages/Home/HomePage")).HomePage,
}));
const DocumentationPage = lazy(async () => ({
  default: (await import("@/pages/Documentation/DocumentationPage"))
    .DocumentationPage,
}));
const HelpPage = lazy(async () => ({
  default: (await import("@/pages/Help/HelpPage")).HelpPage,
}));
const NotFoundPage = lazy(async () => ({
  default: (await import("@/pages/NotFound/NotFoundPage")).NotFoundPage,
}));

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <HomePage /> },

      ...learningRoutes,

      { path: "/documentation", element: <DocumentationPage /> },
      { path: "/help", element: <HelpPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
