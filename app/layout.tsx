import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Link from 'next/link';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'FunnyNews',
    template: '%s | FunnyNews',
  },
  description:
    'Discover the most hilarious and absurd news stories from around the web. A modern news aggregation platform focusing on humor and viral content.',
  keywords: ['funny news', 'viral news', 'humor', 'comedy', 'absurd news', 'entertainment', 'news aggregator'],
  authors: [{ name: 'FunnyNews Team' }],
  openGraph: {
    title: 'FunnyNews — News so Weird It Must Be Real',
    description: 'Your daily dose of the funniest and most absurd news from around the world.',
    type: 'website',
    locale: 'en_US',
    siteName: 'FunnyNews',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://funnynews.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark');})();`,
          }}
        />
      </head>
      <body className={`${playfair.variable} ${dmSans.variable} font-sans antialiased`}>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1">{children}</main>

          <footer className="border-t border-border/25 bg-muted/[0.04]">
            <div className="container-responsive py-10 md:py-12">

              {/* Top row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
                {/* Wordmark + description */}
                <div className="space-y-4 md:col-span-1">
                  <Link href="/" className="inline-flex items-baseline gap-0.5 leading-none select-none">
                    <span className="font-display font-black italic text-[1.1rem] text-foreground tracking-tight">Funny</span>
                    <em className="font-display font-black text-[1.1rem] text-amber-400 not-italic tracking-tight">News</em>
                  </Link>
                  <p className="text-xs text-muted-foreground/55 leading-relaxed max-w-[240px]">
                    An autonomous multi-agent pipeline that finds, scores, and summarizes the
                    internet&apos;s most absurd news. No editors.
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                    </span>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-green-400/70">
                      System live
                    </span>
                  </div>
                </div>

                {/* Navigation */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/35">
                    Explore
                  </h4>
                  <nav className="space-y-2">
                    {[
                      ['/',         'Home'],
                      ['/discover', 'Discover'],
                      ['/trending', 'Trending'],
                      ['/graph',    'Story Network'],
                    ].map(([href, label]) => (
                      <Link
                        key={href}
                        href={href}
                        className="block text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        {label}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* System */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/35">
                    The Pipeline
                  </h4>
                  <div className="space-y-2">
                    {[
                      'Scrape Agent — every 2 hours',
                      'LLM Enhancer — Groq + Gemini',
                      'Relationship Agent — post-scrape',
                      'Digest Agent — daily 08:00 UTC',
                    ].map(line => (
                      <p key={line} className="text-xs font-mono text-muted-foreground/35 leading-snug">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom row */}
              <div className="pt-6 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-[10px] text-muted-foreground/30 font-mono">
                  FunnyNews — built with Next.js, Railway, Groq, Firestore
                </p>
                <p className="text-[10px] text-muted-foreground/20 font-mono">
                  {new Date().getFullYear()}
                </p>
              </div>

            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
