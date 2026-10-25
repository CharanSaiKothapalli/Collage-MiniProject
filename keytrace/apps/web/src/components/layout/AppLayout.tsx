import React from "react";
import { Navbar } from "./Navbar.js";
import { Footer } from "./Footer.js";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cyber-radial text-foreground relative overflow-hidden">
      {/* Ambient background light cones */}
      <div className="pointer-events-none absolute top-[-10%] left-[20%] w-[500px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-[25%] right-[-5%] w-[450px] h-[400px] bg-accent/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[10%] left-[-5%] w-[500px] h-[450px] bg-indigo-600/10 rounded-full blur-[150px]" />
      
      {/* High-tech subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-grid-technical opacity-40 [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_80%)]" />

      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}

