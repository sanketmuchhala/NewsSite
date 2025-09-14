import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Weird Sounds Discovery',
  description: 'Discover the weirdest sounds on the internet - a viral collection of cursed audio, liminal sounds, and experimental oddities.',
  keywords: ['weird sounds', 'cursed audio', 'liminal sounds', 'experimental audio', 'sound discovery'],
  authors: [{ name: 'Weird Sounds Discovery' }],
  openGraph: {
    title: 'Weird Sounds Discovery',
    description: 'Discover the weirdest sounds on the internet',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weird Sounds Discovery',
    description: 'Discover the weirdest sounds on the internet',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-weird-darker text-white">
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 bg-weird-darker/90 backdrop-blur-lg border-b border-weird-purple/20">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <a href="/" className="text-2xl font-bold bg-gradient-to-r from-weird-purple to-weird-pink bg-clip-text text-transparent hover:animate-pulse">
                  🔊 WEIRD SOUNDS
                </a>
                <div className="flex items-center gap-4">
                  <a href="/" className="hover:text-weird-purple transition-colors">
                    Home
                  </a>
                  <a href="/graph" className="hover:text-weird-cyan transition-colors">
                    Graph
                  </a>
                  <a
                    href="/"
                    className="weird-button px-4 py-2 rounded-lg text-white font-semibold hover:scale-105 transition-transform inline-block text-center"
                  >
                    🎲 Weird Roulette
                  </a>
                </div>
              </div>
            </nav>
          </header>

          <main className="flex-1">
            {children}
          </main>

          <footer className="bg-weird-dark border-t border-weird-purple/20 py-8">
            <div className="container mx-auto px-4 text-center">
              <p className="text-gray-400">
                Made for the weird side of the internet 👻
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Sounds are streamed from their original sources • No files stored
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}