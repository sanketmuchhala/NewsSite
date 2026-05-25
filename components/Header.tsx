'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Sun, Moon } from 'lucide-react';

const NAV_LINKS = [
  { href: '/',         label: 'Home'      },
  { href: '/discover', label: 'Discover'  },
  { href: '/trending', label: 'Trending'  },
  { href: '/graph',    label: 'Network'   },
];

export default function Header() {
  const pathname  = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark,   setIsDark]   = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Theme init - read localStorage before paint
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark  = saved !== 'light';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  // Scroll detection for header density transition
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-background/98 backdrop-blur-md border-b border-border/60 shadow-[0_1px_0_0_hsl(var(--border)/0.6)]'
          : 'bg-background/90 backdrop-blur border-b border-border/25'
      }`}
    >
      {/* Amber accent line - top of header */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      <div className="container-responsive">
        <div className="flex h-14 items-stretch justify-between">

          {/* ── Wordmark ─────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-3 group py-3 pr-6 border-r border-border/25 mr-2"
            aria-label="FunnyNews home"
          >
            <div className="flex items-baseline gap-0.5 leading-none select-none">
              <span className="font-display font-black italic text-[1.2rem] text-foreground tracking-tight transition-colors group-hover:text-foreground/80">
                Funny
              </span>
              <em className="font-display font-black text-[1.2rem] text-amber-400 not-italic tracking-tight transition-colors group-hover:text-amber-300">
                News
              </em>
            </div>

            {/* Live pulse - reinforces the "agent running" story */}
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
              </span>
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-amber-400/60">
                Live
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ──────────────────────────────────── */}
          <nav className="hidden md:flex items-stretch flex-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center px-4 text-[13px] font-medium tracking-wide transition-colors duration-150 ${
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}

                  {/* Amber underline - sits flush at header bottom edge */}
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all duration-200 ${
                      active
                        ? 'bg-amber-400 opacity-100'
                        : 'bg-amber-400 opacity-0 group-hover:opacity-0'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* ── Right actions ─────────────────────────────────── */}
          <div className="flex items-center gap-1 pl-4 border-l border-border/25 ml-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 ${
                isDark
                  ? 'text-amber-400/70 hover:text-amber-400 hover:bg-amber-400/8'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark
                ? <Sun  className="w-[15px] h-[15px]" />
                : <Moon className="w-[15px] h-[15px]" />
              }
            </button>

            {/* CTA button - amber, matches site CTAs */}
            <Link href="/discover" className="hidden sm:block ml-1">
              <button className="h-8 px-4 rounded-lg bg-amber-400 text-zinc-950 text-[12px] font-bold tracking-wide hover:bg-amber-300 active:bg-amber-500 transition-colors duration-150">
                Explore
              </button>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all ml-1"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span
                className={`transition-transform duration-200 ${menuOpen ? 'rotate-90' : 'rotate-0'}`}
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ──────────────────────────────────────── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-out ${
          menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-border/30 bg-background/99">
          {/* Amber top stripe inside mobile menu */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />

          <nav className="container-responsive py-3 space-y-0.5" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    active
                      ? 'text-foreground border-l-2 border-amber-400 bg-amber-400/[0.05] pl-[10px]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent'
                  }`}
                >
                  {label}
                  {active && (
                    <span className="ml-auto w-1 h-1 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}

            {/* Mobile CTA */}
            <div className="pt-2 pb-1 px-3">
              <Link href="/discover" onClick={() => setMenuOpen(false)}>
                <button className="w-full h-9 rounded-lg bg-amber-400 text-zinc-950 text-[12px] font-bold tracking-wide hover:bg-amber-300 transition-colors">
                  Explore Stories
                </button>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
