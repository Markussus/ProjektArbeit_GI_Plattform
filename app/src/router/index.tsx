import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout/MainLayout";
import { HomePage } from "@/pages/Home/HomePage";
import { FundamentalsCSPage } from "@/pages/FundamentalsCS/FundamentalsCSPage";
import { DocumentationPage } from "@/pages/Documentation/DocumentationPage";
import { HelpPage } from "@/pages/Help/HelpPage";
import { NotFoundPage } from "@/pages/NotFound/NotFoundPage";
import { learningTopicRoutes } from "@/features/modules/catalog";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <HomePage /> },

      { path: "/fundamentals-cs", element: <FundamentalsCSPage /> },
      ...learningTopicRoutes,

      { path: "/documentation", element: <DocumentationPage /> },
      { path: "/help", element: <HelpPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
