/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout/MainLayout";
import { learningRoutes } from "@/data/moduleCatalog";

const HomePage = lazy(() => import("@/pages/Home/HomePage"));
const InfoPage = lazy(async () => ({
  default: (await import("@/pages/Info/InfoPage")).InfoPage,
}));
const NotFoundPage = lazy(() => import("@/pages/NotFound/NotFoundPage"));

function getRouterBasename() {
  const baseUrl = import.meta.env.BASE_URL;

  // Vite also allows a full URL as `base`; React Router only wants its pathname.
  const pathname = new URL(baseUrl || "/", window.location.origin).pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

const routerBasename = getRouterBasename();

export const router = createBrowserRouter(
  [
    {
      element: <MainLayout />,
      children: [
        { path: "/", element: <HomePage /> },

        ...learningRoutes,

        { path: "/info", element: <InfoPage /> },
        { path: "/help", element: <Navigate to="/info" replace /> },
        { path: "/legal", element: <Navigate to="/info#legal" replace /> },
        { path: "/documentation", element: <Navigate to="/info" replace /> },

        { path: "*", element: <NotFoundPage /> },
      ],
    },
  ],
  {
    basename: routerBasename,
  },
);
