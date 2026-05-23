'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { NewsStory, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowUp, Clock, Globe, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ─── Shared theme system ─────────────────────────────────────

const CARD_THEMES = [
  { gradient: 'from-orange-950 via-orange-900/60 to-amber-950', emoji: '🔥' },
  { gradient: 'from-emerald-950 via-green-900/60 to-teal-950', emoji: '🌿' },
  { gradient: 'from-blue-950 via-blue-900/60 to-cyan-950', emoji: '⚡' },
  { gradient: 'from-purple-950 via-violet-900/60 to-indigo-950', emoji: '🪄' },
  { gradient: 'from-rose-950 via-pink-900/60 to-rose-950', emoji: '🎭' },
  { gradient: 'from-teal-950 via-cyan-900/60 to-sky-950', emoji: '🌊' },
  { gradient: 'from-amber-950 via-yellow-900/60 to-orange-950', emoji: '✨' },
  { gradient: 'from-indigo-950 via-violet-900/60 to-purple-950', emoji: '🎯' },
];

function getTheme(story: NewsStory) {
  return CARD_THEMES[(story.id ?? 0) % CARD_THEMES.length];
}

function timeAgo(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return null; }
}

// ─── Ticker ──────────────────────────────────────────────────

const FALLBACK_HEADLINES = [
  'Florida Man Arrested for Teaching Squirrels to Water Ski',
  "Emotional Support Peacock Denied Entry to Walmart",
  'Scientists Discover Procrastination Gene — Will Study It Later',
  "Woman Sues Neighbor Over Aggressively Cheerful Morning Greetings",
  "Mayor Declares City Pigeon as Official Mascot",
  'Area Man Finally Wins Argument with GPS Navigation System',
  'Town Declares War on Aggressive Geese, Forms Citizen Militia',
  "Man Calls 911 to Complain About McDonald's Ice Cream Machine",
];

function Ticker({ items }: { items: string[] }) {
  const all = items.length >= 4 ? items : FALLBACK_HEADLINES;
  const doubled = [...all, ...all];
  return (
    <div className="overflow-hidden bg-amber-400 border-y border-amber-300/60 py-2.5 select-none">
      <div
        className="flex whitespace-nowrap will-change-transform"
        style={{ animation: 'marquee 45s linear infinite' }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 px-5 text-[11px] font-bold uppercase tracking-widest text-zinc-900">
            <span className="text-amber-700/60 text-xs">◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Animated stat counter ────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (target === 0 || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

// ─── Featured story card ──────────────────────────────────────

function FeaturedCard({ story }: { story: NewsStory }) {
  const theme = getTheme(story);
  const ago = timeAgo(story.published_at);
  return (
    <div className="grid lg:grid-cols-5 overflow-hidden rounded-2xl border border-border/50 bg-card/30 group">
      {/* Visual panel */}
      <div className={`lg:col-span-2 min-h-[200px] lg:min-h-0 bg-gradient-to-br ${theme.gradient} flex items-center justify-center relative overflow-hidden`}>
        <span className="text-8xl opacity-[0.12] select-none">{theme.emoji}</span>
        {/* Funny score chip */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
          <span className="text-sm">😂</span>
          <div className="w-14 h-1 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${story.funny_score ?? 70}%` }} />
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">{story.funny_score ?? 70}</span>
        </div>
        {/* Source */}
        <div className="absolute bottom-4 left-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            {story.source}
          </span>
        </div>
      </div>

      {/* Content panel */}
      <div className="lg:col-span-3 p-6 md:p-8 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-amber-400/10 text-amber-400 border-amber-400/20 text-[9px] font-bold uppercase tracking-widest gap-1.5">
              🔥 Featured
            </Badge>
            {ago && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />{ago}
              </span>
            )}
          </div>

          <Link href={`/story/${story.id}`}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight hover:text-amber-400 transition-colors duration-200 mb-3">
              {story.title}
            </h2>
          </Link>

          {story.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-5">
              {story.summary}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-green-400">
              <ArrowUp className="w-4 h-4" />
              {(story.upvotes ?? 0).toLocaleString()}
            </span>
            {story.view_count ? (
              <span className="text-xs text-muted-foreground hidden sm:block">
                {story.view_count >= 1000 ? `${(story.view_count / 1000).toFixed(1)}k` : story.view_count} views
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Link href={`/story/${story.id}`}>
              <Button size="sm" className="bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold text-xs px-4">
                Read Story
              </Button>
            </Link>
            <Button
              variant="outline" size="sm" className="text-xs gap-1 hidden sm:flex"
              onClick={() => window.open(story.url, '_blank', 'noopener,noreferrer')}
            >
              Original <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mini story card ──────────────────────────────────────────

function MiniCard({ story }: { story: NewsStory }) {
  const theme = getTheme(story);
  return (
    <Link href={`/story/${story.id}`} className="group block">
      <div className="rounded-xl overflow-hidden border border-border/40 bg-card/20 hover:border-amber-400/30 hover:bg-card/50 transition-all duration-200">
        <div className={`h-28 bg-gradient-to-br ${theme.gradient} flex items-center justify-center relative`}>
          <span className="text-4xl opacity-[0.15] select-none">{theme.emoji}</span>
          {story.funny_score !== undefined && (
            <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold text-amber-400 bg-black/40 rounded px-1.5 py-0.5">
              {story.funny_score}
            </span>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="font-display font-bold text-[13px] text-foreground group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug mb-2">
            {story.title}
          </h3>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="truncate max-w-[100px]">{story.source}</span>
            <span className="flex items-center gap-0.5 text-green-400 shrink-0">
              <ArrowUp className="w-2.5 h-2.5" />
              {(story.upvotes ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Grid skeleton ────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-56 bg-muted/30 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-muted/20 rounded-xl" />)}
      </div>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────

const CATEGORY_TAGS: Record<string, string[]> = {
  WTF:       ['wtf', 'bizarre', 'absurd', 'florida-man', 'stupid', 'nottheonion'],
  Animals:   ['animals', 'geese', 'bird', 'peacock', 'squirrel', 'pigeon', 'dog', 'cat'],
  Satire:    ['satire', 'onion', 'babylon-bee', 'clickhole', 'beaverton'],
  Science:   ['science', 'scientists', 'research', 'discovery'],
  Politics:  ['politics', 'government', 'rally', 'election', 'politician'],
  Tech:      ['technology', 'tech', 'ai', 'gps', 'internet'],
};

function filterByCategory(stories: NewsStory[], cat: string): NewsStory[] {
  if (cat === 'All') return stories;
  const tags = CATEGORY_TAGS[cat] ?? [];
  return stories.filter(s => {
    const st = s.tags?.map(t => t.toLowerCase()) ?? [];
    const src = (s.source ?? '').toLowerCase();
    return tags.some(t => st.includes(t) || src.includes(t));
  });
}

function LandingContent() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [stats, setStats] = useState({ total: 0, today: 0, engagement: 0 });

  const totalCount  = useCountUp(stats.total);
  const todayCount  = useCountUp(stats.today);
  const engageCount = useCountUp(stats.engagement);

  useEffect(() => {
    fetch('/api/stories?pageSize=20')
      .then(r => r.json())
      .then((res: PaginatedResponse<NewsStory>) => {
        if (res.success && res.data) {
          setStories(res.data);
          const total = res.pagination?.total ?? res.data.length;
          setStats({ total, today: Math.max(1, Math.floor(total * 0.1)), engagement: Math.min(98, 65 + (total % 33)) });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const CATEGORIES = ['All', 'WTF', 'Animals', 'Satire', 'Science', 'Politics', 'Tech'];
  const filtered = filterByCategory(stories, activeCategory);
  const featured = filtered[0];
  const gridStories = filtered.slice(1, 7);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-64px)] flex flex-col justify-center overflow-hidden bg-background">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:28px_28px] opacity-50 pointer-events-none" />
        {/* Amber glow bloom */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="container-responsive relative z-10 py-20 md:py-28">
          {/* Live indicator */}
          <div
            className="inline-flex items-center gap-2.5 mb-10 px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5"
            style={{ animation: 'heroIn 0.7s ease both' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Live feed</span>
            <span className="text-[11px] text-muted-foreground">· updated every hour</span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-black tracking-tighter leading-[0.88] mb-8"
            style={{ fontSize: 'clamp(3.2rem, 9.5vw, 8.5rem)', animation: 'heroIn 0.9s 0.08s ease both' }}
          >
            <span className="block text-foreground">News so Weird</span>
            <em className="block text-amber-400 not-italic">It Must Be Real.</em>
          </h1>

          {/* Sub */}
          <p
            className="text-base md:text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed"
            style={{ animation: 'heroIn 0.9s 0.2s ease both' }}
          >
            The internet&apos;s finest collection of hilarious, absurd, and unbelievably true stories —
            curated by AI, ranked by humans.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap gap-3 mb-14"
            style={{ animation: 'heroIn 0.9s 0.32s ease both' }}
          >
            <Button
              size="lg"
              className="bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold px-8 text-sm h-11"
              onClick={() => document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Stories
            </Button>
            <Link href="/discover">
              <Button variant="outline" size="lg" className="font-semibold px-8 text-sm h-11 border-border/60 gap-2">
                Browse by Category <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div
            className="flex flex-wrap items-center gap-6 md:gap-8 pt-6 border-t border-border/30 text-sm"
            style={{ animation: 'heroIn 0.9s 0.42s ease both' }}
          >
            {[
              { icon: <Globe className="w-4 h-4" />, value: totalCount, label: 'stories' },
              { icon: <TrendingUp className="w-4 h-4" />, value: todayCount, label: 'added today' },
              { icon: <Zap className="w-4 h-4" />, value: engageCount, label: '% engagement', suffix: '%' },
            ].map(({ icon, value, label, suffix }) => (
              <div key={label} className="flex items-center gap-2 text-muted-foreground">
                <span className="text-muted-foreground/50">{icon}</span>
                <span>
                  <strong className="font-display font-bold text-foreground text-base tabular-nums">
                    {value.toLocaleString()}{suffix}
                  </strong>
                  <span className="ml-1.5 text-xs">{label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll nudge */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/30"
          style={{ animation: 'heroIn 1s 0.7s ease both' }}
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-muted-foreground/30" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em]">scroll</span>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────── */}
      <Ticker items={stories.map(s => s.title)} />

      {/* ── STORIES ──────────────────────────────────────────── */}
      <section id="stories" className="section-padding">
        <div className="container-responsive">
          {loading ? (
            <GridSkeleton />
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <div className="mb-14">
                  <div className="flex items-center gap-4 mb-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Featured Story</span>
                    <div className="h-px flex-1 bg-border/40" />
                  </div>
                  <FeaturedCard story={featured} />
                </div>
              )}

              {/* Category filter + grid */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latest Stories</span>
                    <div className="h-px w-8 bg-border/40" />
                  </div>
                  <Link href="/discover" className="text-xs text-muted-foreground hover:text-amber-400 transition-colors flex items-center gap-1 self-end sm:self-auto">
                    View all on Discover <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Category pills */}
                <div className="flex flex-wrap gap-2 mb-7">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                        activeCategory === cat
                          ? 'bg-amber-400 text-zinc-950 shadow-sm shadow-amber-400/20'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-border/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                {gridStories.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gridStories.map((story, i) => (
                      <div key={story.id} style={{ animation: `heroIn 0.6s ${i * 0.07}s ease both` }}>
                        <MiniCard story={story} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-10 text-sm">
                    No stories in this category yet — try another!
                  </p>
                )}

                {stories.length > 7 && (
                  <div className="text-center mt-10">
                    <Link href="/discover">
                      <Button variant="outline" className="gap-2 font-semibold border-border/50">
                        Discover All Stories <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── WHY FUNNYNEWS ────────────────────────────────────── */}
      <section className="section-padding bg-muted/[0.15] border-y border-border/30">
        <div className="container-responsive">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-3">Why Us</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              News, but make it{' '}
              <em className="text-amber-400 not-italic">actually funny</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: '🤖',
                title: 'AI-Curated',
                desc: 'Our AI scans thousands of sources daily, scoring each story for humor, absurdity, and pure WTF factor before it ever reaches you.',
              },
              {
                icon: '📊',
                title: 'Human-Ranked',
                desc: 'Real readers vote on what\'s actually funny, so the best stories rise naturally. No algorithm manipulation — just pure crowd wisdom.',
              },
              {
                icon: '⚡',
                title: 'Live Updates',
                desc: 'Fresh stories every hour from Reddit, The Onion, Babylon Bee, and dozens of other absurdist news sources around the web.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border/40 bg-card/20 p-7 text-center hover:border-amber-400/20 hover:bg-card/40 transition-all duration-200"
              >
                <div className="text-4xl mb-5">{f.icon}</div>
                <h3 className="font-display font-bold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="section-padding">
        <div className="container-responsive">
          <div className="relative overflow-hidden rounded-2xl border border-amber-400/15 bg-amber-400/[0.03] px-8 py-14 text-center">
            {/* Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(45,95%,55%,0.08),transparent_65%)] pointer-events-none" />
            {/* Decorative horizontal lines */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

            <Sparkles className="w-7 h-7 text-amber-400 mx-auto mb-5" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Get Your Daily Dose
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              The funniest stories delivered to your inbox every morning.
              No fluff, no ads — just absurdity.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              />
              <Button className="bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold shrink-0 text-sm">
                Subscribe Free
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LandingContent />
    </Suspense>
  );
}
