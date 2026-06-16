import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { LoadingFallback } from "@/components/shared/LoadingFallback/LoadingFallback";
import { Header } from "@/components/shared/Header/Header";
import { Sidebar } from "@/components/shared/Sidebar/Sidebar";
import { Footer } from "@/components/shared/Footer/Footer";
import { useUiStore } from "@/store/uiStore";

export function MainLayout() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <div className="bg-background text-foreground flex h-screen flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

        <main className="bg-background flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <Suspense fallback={<LoadingFallback className="min-h-full" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <Footer />
    </div>
  );
}
