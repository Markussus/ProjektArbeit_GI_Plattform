import { HeroSection } from "./components/HeroSection";
import { ModuleSelector } from "./components/ModuleSelector";

export function HomePage() {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-4xl">
        <HeroSection />
        <ModuleSelector />
      </div>
    </div>
  );
}
