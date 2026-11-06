import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar.js";
import { Footer } from "./Footer.js";
import { CommandPalette } from "../ui/CommandPalette.js";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => setPaletteOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080B12] text-[#F4F7FC] relative overflow-hidden selection:bg-[#35D6E8]/20 selection:text-[#35D6E8]">
      {/* Subtle top spotlight glow (Obsidian Pulse cyan & violet) */}
      <div className="pointer-events-none absolute top-[-160px] left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-[#35D6E8]/[0.04] rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-[25%] right-[-100px] w-[500px] h-[350px] bg-[#8B7CFF]/[0.03] rounded-full blur-[140px]" />

      {/* Subtle modern dot grid */}
      <div className="pointer-events-none absolute inset-0 bg-dots-subtle opacity-15 [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_80%)]" />

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <Navbar onOpenPalette={() => setPaletteOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      <Footer />
    </div>
  );
}
