import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/shared/Header/Header";
import { Sidebar } from "@/components/shared/Sidebar/Sidebar";
import { Footer } from "@/components/shared/Footer/Footer";

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="bg-background text-foreground flex h-screen flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />

        <main className="bg-background flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}
