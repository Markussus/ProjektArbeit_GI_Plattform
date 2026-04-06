import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout/MainLayout";
import { HomePage } from "@/pages/Home/HomePage";
import { FundamentalsCSPage } from "@/pages/FundamentalsCS/FundamentalsCSPage";
import { TuringMachinePage } from "@/pages/FundamentalsCS/TuringMachine/TuringMachinePage";
import { FiniteAutomataPage } from "@/pages/FundamentalsCS/FiniteAutomata/FiniteAutomataPage";
import { NumberSystemsPage } from "@/pages/FundamentalsCS/NumberSystems/NumberSystemsPage";
import { MooreMealyPage } from "@/pages/FundamentalsCS/MooreMealy/MooreMealyPage";
import { DnfPage } from "@/pages/FundamentalsCS/Dnf/DnfPage";
import { DocumentationPage } from "@/pages/Documentation/DocumentationPage";
import { HelpPage } from "@/pages/Help/HelpPage";
import { NotFoundPage } from "@/pages/NotFound/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <HomePage /> },

      { path: "/fundamentals-cs", element: <FundamentalsCSPage /> },
      {
        path: "/fundamentals-cs/turing-machine",
        element: <TuringMachinePage />,
      },
      {
        path: "/fundamentals-cs/finite-automata",
        element: <FiniteAutomataPage />,
      },
      {
        path: "/fundamentals-cs/number-systems",
        element: <NumberSystemsPage />,
      },
      { path: "/fundamentals-cs/moore-mealy", element: <MooreMealyPage /> },
      { path: "/fundamentals-cs/dnf", element: <DnfPage /> },

      { path: "/documentation", element: <DocumentationPage /> },
      { path: "/help", element: <HelpPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
