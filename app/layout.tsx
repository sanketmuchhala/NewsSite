import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

          <footer className="border-t border-border/40 bg-muted/20">
            <div className="container-responsive py-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div className="space-y-3 md:col-span-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-lg text-foreground">Funny<em className="text-amber-400 not-italic">News</em></span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your daily dose of humor from the world&apos;s most absurd news stories. Curated by AI, loved by humans.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Explore</h4>
                  <div className="space-y-2 text-sm">
                    {[['/', 'Latest Stories'], ['/trending', 'Trending Now'], ['/discover', 'Discover'], ['/graph', 'Story Network']].map(([href, label]) => (
                      <Link key={href} href={href} className="text-muted-foreground hover:text-foreground transition-colors block text-xs">{label}</Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company</h4>
                  <div className="space-y-2">
                    {['/about', '/contact', '/privacy', '/terms'].map((href) => (
                      <Link key={href} href={href} className="text-muted-foreground hover:text-foreground transition-colors block capitalize text-xs">
                        {href.replace('/', '')}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stay Updated</h4>
                  <p className="text-xs text-muted-foreground">Get absurdity delivered daily.</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="flex-1 px-3 py-2 text-xs rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    />
                    <Button size="sm" className="bg-amber-400 text-zinc-950 hover:bg-amber-300 text-xs font-bold shrink-0">
                      Go
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-3">
                <p className="text-xs text-muted-foreground">© 2024 FunnyNews. All rights reserved.</p>
                <div className="flex gap-4">
                  <a href="#" className="text-muted-foreground hover:text-amber-400 transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-amber-400 transition-colors">
                    <span className="sr-only">Reddit</span>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.249-1.249 0-.687-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
