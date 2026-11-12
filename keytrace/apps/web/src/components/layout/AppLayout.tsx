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
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
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
    <div className="min-h-screen flex flex-col bg-[#0B1220] text-[#F8FAFC] relative overflow-x-clip selection:bg-[#FF6A00]/20 selection:text-[#FF6A00]">
      {/* Subtle top atmospheric glow (Vibrant Orange & Electric Blue) */}
      <div className="pointer-events-none absolute top-[-160px] left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-[#38BDF8]/[0.025] rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-[25%] right-[-100px] w-[500px] h-[350px] bg-[#FF6A00]/[0.015] rounded-full blur-[140px]" />

      {/* Subtle modern dot grid */}
      <div className="pointer-events-none absolute inset-0 bg-dots-subtle opacity-20 [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_80%)]" />

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
