/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout/MainLayout";
import { learningRoutes } from "@/data/moduleCatalog";

const HomePage = lazy(async () => ({
  default: (await import("@/pages/Home/HomePage")).HomePage,
}));
const InfoPage = lazy(async () => ({
  default: (await import("@/pages/Info/InfoPage")).InfoPage,
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

      { path: "/info", element: <InfoPage /> },
      { path: "/help", element: <Navigate to="/info" replace /> },
      { path: "/legal", element: <Navigate to="/info#legal" replace /> },
      { path: "/documentation", element: <Navigate to="/info" replace /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
