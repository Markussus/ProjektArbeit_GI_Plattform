import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";

function App() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t("app.title");
  }, [t, i18n.language]);

  return <RouterProvider router={router} />;
}

export default App;
