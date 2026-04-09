import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout/MainLayout";
import { HomePage } from "@/pages/Home/HomePage";
import { DocumentationPage } from "@/pages/Documentation/DocumentationPage";
import { HelpPage } from "@/pages/Help/HelpPage";
import { NotFoundPage } from "@/pages/NotFound/NotFoundPage";
import { learningRoutes } from "@/data/moduleCatalog";

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
