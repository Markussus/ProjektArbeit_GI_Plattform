import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";

function App() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Route content is translated inside the router tree, but the document
    // title must still be synchronized manually when the language changes.
    document.title = t("common.app.title");
  }, [t, i18n.language]);

  return <RouterProvider router={router} />;
}

export default App;
