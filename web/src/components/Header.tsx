"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [["play", "Play"], ["features", "Features"], ["agents", "Agents"], ["about", "About"]];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-line bg-black/80 px-5 py-4 backdrop-blur md:px-14">
      <a href="#top" className="text-xl font-bold tracking-tight">Neon-Pulse</a>
      <nav className="hidden gap-8 font-mono text-sm md:flex">
        {links.map(([id, t]) => <a key={id} href={"#" + id} className="hover:text-brand">{t}</a>)}
      </nav>
      <div className="flex items-center gap-3">
        <a href="#play" className="bg-brand px-5 py-2.5 font-medium hover:bg-brand-dark">Play now</a>
        <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="p-2 md:hidden">
          <span className="block h-0.5 w-6 bg-white" /><span className="mt-1.5 block h-0.5 w-6 bg-white" /><span className="mt-1.5 block h-0.5 w-3 bg-white" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 -z-10 flex flex-col gap-2 bg-black px-6 pt-24">
            {links.map(([id, t]) => <a key={id} href={"#" + id} onClick={() => setOpen(false)} className="border-b border-line py-3 text-3xl font-bold">{t}</a>)}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
