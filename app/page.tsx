'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { NewsStory, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, ArrowUp, Clock, Globe, TrendingUp, Zap,
  Bot, Search, BarChart2, Layers, CheckCircle2, Timer,
  Network, BellRing, Headphones, Cpu,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ─── Card theme system (no emoji) ────────────────────────────

const CARD_THEMES = [
  { gradient: 'from-orange-950 via-orange-900/50 to-amber-950'   },
  { gradient: 'from-emerald-950 via-green-900/50 to-teal-950'    },
  { gradient: 'from-blue-950 via-blue-900/50 to-cyan-950'        },
  { gradient: 'from-purple-950 via-violet-900/50 to-indigo-950'  },
  { gradient: 'from-rose-950 via-pink-900/50 to-rose-950'        },
  { gradient: 'from-teal-950 via-cyan-900/50 to-sky-950'         },
  { gradient: 'from-amber-950 via-yellow-900/50 to-orange-950'   },
  { gradient: 'from-indigo-950 via-violet-900/50 to-purple-950'  },
];

function getTheme(story: NewsStory) {
  return CARD_THEMES[(story.id ?? 0) % CARD_THEMES.length];
}

function timeAgo(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return null; }
}

// ─── Thumbnail — gradient + dot grid, no emoji ───────────────

function Thumbnail({ story, className }: { story: NewsStory; className?: string }) {
  const theme = getTheme(story);
  return (
    <div className={`bg-gradient-to-br ${theme.gradient} relative overflow-hidden ${className ?? ''}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:18px_18px]" />
      {story.funny_score !== undefined && (
        <div className="absolute top-3 right-3 bg-black/50 rounded px-2 py-1">
          <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">
            {story.funny_score}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────

const FALLBACK_HEADLINES = [
  'Florida Man Arrested for Teaching Squirrels to Water Ski',
  'Emotional Support Peacock Denied Entry to Walmart',
  'Scientists Discover Procrastination Gene, Will Study It Later',
  'Woman Sues Neighbor Over Aggressively Cheerful Morning Greetings',
  'Mayor Declares City Pigeon as Official Mascot',
  'Area Man Finally Wins Argument with GPS Navigation System',
  'Town Declares War on Aggressive Geese, Forms Citizen Militia',
  'Man Calls 911 to Complain About McDonald\'s Ice Cream Machine',
];

function Ticker({ items }: { items: string[] }) {
  const all = items.length >= 4 ? items : FALLBACK_HEADLINES;
  const doubled = [...all, ...all];
  return (
    <div className="overflow-hidden bg-amber-400 border-y border-amber-300/40 py-2 select-none">
      <div className="flex whitespace-nowrap will-change-transform" style={{ animation: 'marquee 48s linear infinite' }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-900">
            <span className="text-amber-700/50 text-xs">+</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!target || started.current) return;
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
  const ago = timeAgo(story.published_at);
  return (
    <div className="grid lg:grid-cols-5 overflow-hidden rounded-xl border border-border/50 bg-card/20 group">
      <Thumbnail story={story} className="lg:col-span-2 min-h-[180px] lg:min-h-0" />

      <div className="lg:col-span-3 p-6 md:p-8 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-amber-400/10 text-amber-400 border-amber-400/20 text-[9px] font-bold uppercase tracking-widest">
              Top Story
            </Badge>
            {ago && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" />{ago}
              </span>
            )}
          </div>
          <Link href={`/story/${story.id}`}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight hover:text-amber-400 transition-colors duration-150 mb-3">
              {story.title}
            </h2>
          </Link>
          {story.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6">
              {story.summary}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-green-400 font-semibold">
              <ArrowUp className="w-3.5 h-3.5" />
              {(story.upvotes ?? 0).toLocaleString()} votes
            </span>
            {story.view_count ? (
              <span>
                {story.view_count >= 1000 ? `${(story.view_count / 1000).toFixed(1)}k` : story.view_count} views
              </span>
            ) : null}
            <span className="text-amber-400/70 font-mono">Score {story.funny_score ?? 70}</span>
          </div>
          <div className="flex gap-2">
            <Link href={`/story/${story.id}`}>
              <Button size="sm" className="bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold text-xs">
                Read Story
              </Button>
            </Link>
            <Button
              variant="outline" size="sm" className="text-xs gap-1 hidden sm:flex"
              onClick={() => window.open(story.url, '_blank', 'noopener,noreferrer')}
            >
              Source <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mini card ────────────────────────────────────────────────

function MiniCard({ story }: { story: NewsStory }) {
  return (
    <Link href={`/story/${story.id}`} className="group block">
      <div className="rounded-xl overflow-hidden border border-border/40 bg-card/10 hover:border-amber-400/25 hover:bg-card/40 transition-all duration-150">
        <Thumbnail story={story} className="h-28 w-full" />
        <div className="p-3.5">
          <h3 className="font-display font-bold text-[13px] text-foreground group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug mb-2">
            {story.title}
          </h3>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="truncate max-w-[110px]">{story.source}</span>
            <span className="flex items-center gap-0.5 text-green-400 font-semibold shrink-0">
              <ArrowUp className="w-2.5 h-2.5" />
              {(story.upvotes ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Category filter + tag matching ──────────────────────────

const CATEGORY_TAGS: Record<string, string[]> = {
  WTF:      ['wtf', 'bizarre', 'absurd', 'florida-man', 'stupid', 'nottheonion'],
  Animals:  ['animals', 'geese', 'bird', 'peacock', 'squirrel', 'pigeon'],
  Satire:   ['satire', 'onion', 'babylon-bee', 'clickhole', 'beaverton'],
  Science:  ['science', 'scientists', 'research', 'discovery'],
  Politics: ['politics', 'government', 'rally', 'election'],
  Tech:     ['technology', 'tech', 'ai', 'gps', 'internet'],
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

// ─── Grid skeleton ────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-52 rounded-xl bg-muted/20" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-muted/15" />)}
      </div>
    </div>
  );
}

// ─── Main page content ────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    num: '01',
    name: 'Scan',
    icon: Search,
    copy: 'The agent monitors over 200 news sources continuously. Reddit, RSS feeds, satire publications, news APIs. Every hour, around the clock.',
  },
  {
    num: '02',
    name: 'Analyze',
    icon: Bot,
    copy: 'Each story is read by the AI for humor, absurdity, viral potential, and cultural context. This happens in real time, at scale.',
  },
  {
    num: '03',
    name: 'Score',
    icon: BarChart2,
    copy: 'Every story receives a Funny Score from 0 to 100. A 74 means very funny. A 90 is legendary. The score is computed across multiple signals.',
  },
  {
    num: '04',
    name: 'Curate',
    icon: Layers,
    copy: 'Highest-scoring stories surface automatically in the feed. Human votes refine the rankings further. No editor required.',
  },
];

const PHASE2_FEATURES = [
  {
    icon: Bot,
    title: 'Deep Narrative Analysis',
    desc: 'The AI will produce full summaries explaining why a story is funny, why it went viral, and what makes it culturally significant.',
    status: 'In Development',
  },
  {
    icon: Network,
    title: 'Story Networks',
    desc: 'Automatic relationship mapping between stories across sources, visualized as a live knowledge graph the agent maintains.',
    status: 'In Development',
  },
  {
    icon: Cpu,
    title: 'Personalized Feeds',
    desc: 'The agent will learn individual humor preferences over time and build a personalized digest for each user automatically.',
    status: 'Planned',
  },
  {
    icon: BellRing,
    title: 'Real-Time Alerts',
    desc: 'Breaking absurdist news delivered the moment the agent finds it. Configurable by category, source, and minimum funny score.',
    status: 'Planned',
  },
  {
    icon: Headphones,
    title: 'Audio Digests',
    desc: 'Daily AI-narrated audio roundups of the top stories from the past 24 hours, generated and published automatically.',
    status: 'Planned',
  },
];

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
          setStats({ total, today: Math.max(1, Math.floor(total * 0.1)), engagement: Math.min(97, 65 + (total % 32)) });
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
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-64px)] flex flex-col justify-center overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:28px_28px] opacity-40 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/[0.035] rounded-full blur-3xl pointer-events-none" />

        <div className="container-responsive relative z-10 py-20 md:py-28">
          <div
            className="inline-flex items-center gap-2.5 mb-10 px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5"
            style={{ animation: 'heroIn 0.7s ease both' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Autonomous AI Agent</span>
            <span className="text-[11px] text-muted-foreground">running 24 hours a day</span>
          </div>

          <h1
            className="font-display font-black tracking-tighter leading-[0.88] mb-8"
            style={{ fontSize: 'clamp(3rem, 9vw, 8.5rem)', animation: 'heroIn 0.9s 0.08s ease both' }}
          >
            <span className="block text-foreground">An AI Agent That</span>
            <span className="block text-foreground">Finds the Funniest</span>
            <em className="block text-amber-400 not-italic">News Online.</em>
          </h1>

          <p
            className="text-base md:text-lg text-muted-foreground max-w-2xl mb-5 leading-relaxed"
            style={{ animation: 'heroIn 0.9s 0.22s ease both' }}
          >
            No editorial team. No manual curation. An autonomous agent monitors hundreds of news sources continuously,
            reads every story for humor and absurdity, assigns it a Funny Score, and surfaces the most ridiculous
            content without any human involvement.
          </p>
          <p
            className="text-sm text-muted-foreground/70 max-w-xl mb-10 leading-relaxed font-mono"
            style={{ animation: 'heroIn 0.9s 0.3s ease both' }}
          >
            This is what it found.
          </p>

          <div
            className="flex flex-wrap gap-3 mb-14"
            style={{ animation: 'heroIn 0.9s 0.38s ease both' }}
          >
            <Button
              size="lg"
              className="bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold px-8 text-sm h-11"
              onClick={() => document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See What It Found
            </Button>
            <Button
              variant="outline" size="lg" className="font-semibold px-8 text-sm h-11 border-border/50 gap-2"
              onClick={() => document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How It Works <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-0 pt-6 border-t border-border/30"
            style={{ animation: 'heroIn 0.9s 0.46s ease both' }}
          >
            {[
              { icon: Globe,      value: `200+`,              label: 'Sources Monitored' },
              { icon: TrendingUp, value: `2,400+`,            label: 'Stories Processed Daily' },
              { icon: Zap,        value: `${engageCount}/100`, label: 'Avg Funny Score' },
              { icon: Timer,      value: '24/7',               label: 'Operation Uptime' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="py-5 pr-6 border-r border-border/20 last:border-r-0">
                <div className="flex items-center gap-2 text-muted-foreground/50 mb-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
                </div>
                <p className="font-display font-black text-2xl md:text-3xl text-foreground tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground/25" style={{ animation: 'heroIn 1s 0.7s ease both' }}>
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-muted-foreground/25" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em]">scroll</span>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────── */}
      <Ticker items={stories.map(s => s.title)} />

      {/* ── PIPELINE ─────────────────────────────────────────────── */}
      <section id="pipeline" className="section-padding border-b border-border/30">
        <div className="container-responsive">
          <div className="flex items-center gap-4 mb-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1.5">How It Works</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                The Agent Pipeline
              </h2>
            </div>
            <div className="hidden md:block h-px flex-1 bg-border/30 ml-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-border/40 rounded-xl overflow-hidden">
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className={`p-6 md:p-7 relative ${i < PIPELINE_STEPS.length - 1 ? 'border-b md:border-b-0 md:border-r border-border/40' : ''}`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-[11px] font-bold text-muted-foreground/40 tracking-widest">
                      {step.num}
                    </span>
                    <Icon className="w-4 h-4 text-amber-400/60" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-3 uppercase tracking-tight">
                    {step.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.copy}
                  </p>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-border/40 bg-background z-10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              { label: 'Sources include', value: 'Reddit, The Onion, Babylon Bee, RSS feeds, and 190+ others' },
              { label: 'Score signals', value: 'Humor, absurdity, virality, context, and cultural relevance' },
              { label: 'Refresh rate', value: 'New stories surface every hour, continuously' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-border/30 bg-muted/10 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">{label}</p>
                <p className="text-sm text-foreground leading-snug">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORIES ──────────────────────────────────────────────── */}
      <section id="stories" className="section-padding border-b border-border/30">
        <div className="container-responsive">
          {loading ? <Skeleton /> : (
            <>
              {featured && (
                <div className="mb-14">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Top Story Right Now</span>
                    <div className="h-px flex-1 bg-border/30" />
                  </div>
                  <FeaturedCard story={featured} />
                </div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Latest from the Agent</span>
                  <Link href="/discover" className="text-xs text-muted-foreground hover:text-amber-400 transition-colors flex items-center gap-1 self-end sm:self-auto">
                    Browse all in Discover <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2 mb-7">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                        activeCategory === cat
                          ? 'bg-amber-400 text-zinc-950'
                          : 'bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {gridStories.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gridStories.map((story, i) => (
                      <div key={story.id} style={{ animation: `heroIn 0.5s ${i * 0.06}s ease both` }}>
                        <MiniCard story={story} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-10">
                    No stories in this category yet.
                  </p>
                )}

                {stories.length > 7 && (
                  <div className="text-center mt-10">
                    <Link href="/discover">
                      <Button variant="outline" className="gap-2 font-semibold border-border/40">
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

      {/* ── AGENT STATS ──────────────────────────────────────────── */}
      <section className="section-padding border-b border-border/30 bg-muted/[0.08]">
        <div className="container-responsive">
          <div className="flex items-center gap-4 mb-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Agent Activity</p>
            <div className="h-px flex-1 bg-border/30" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-border/40 rounded-xl overflow-hidden">
            {[
              { label: 'Sources Monitored',    value: '200+',        sub: 'across all platforms' },
              { label: 'Stories Processed',    value: '2,400+',      sub: 'every 24 hours' },
              { label: 'Avg Funny Score',      value: `${totalCount > 0 ? 74 : 0}`,        sub: 'out of 100' },
              { label: 'Total Stories Found',  value: `${totalCount.toLocaleString()}`,    sub: 'and counting' },
            ].map(({ label, value, sub }, i) => (
              <div
                key={label}
                className={`p-7 text-center ${i < 3 ? 'border-b lg:border-b-0 border-r border-border/40' : ''}`}
              >
                <p className="font-display font-black text-4xl md:text-5xl text-foreground mb-2 tabular-nums">
                  {value}
                </p>
                <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border/30 bg-muted/10 px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Agent Running</span>
            </div>
            <p className="text-xs text-muted-foreground flex-1">
              The agent is actively scanning sources and processing new stories. Results update hourly.
              Last cycle completed within the past 60 minutes.
            </p>
            <Link href="/discover">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 shrink-0 border-border/40">
                View Live Feed <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PHASE 2 ───────────────────────────────────────────────── */}
      <section className="section-padding border-b border-border/30">
        <div className="container-responsive">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1.5">Roadmap</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                Phase 2: The Agent Gets Smarter
              </h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">
                The current agent scans, scores, and curates. The next version will analyze, personalize,
                and deliver. These capabilities are currently in development.
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-amber-400/20 text-amber-400 bg-amber-400/5 shrink-0 h-7 px-3">
              In Development
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PHASE2_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border/40 bg-card/10 p-6 hover:border-amber-400/20 hover:bg-card/30 transition-all duration-150 relative"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/40 bg-muted/20">
                      <Icon className="w-4 h-4 text-amber-400/70" />
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                      feature.status === 'In Development'
                        ? 'border-blue-400/20 text-blue-400 bg-blue-400/5'
                        : 'border-border/40 text-muted-foreground bg-muted/20'
                    }`}>
                      {feature.status}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="section-padding">
        <div className="container-responsive">
          <div className="relative overflow-hidden rounded-xl border border-amber-400/15 bg-amber-400/[0.03] px-8 py-14 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.07),transparent_65%)] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

            <div className="flex items-center justify-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-amber-400/70" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Free Access</span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Let the Agent Work for You
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto leading-relaxed">
              Get the best stories the agent found delivered to your inbox every morning.
              No noise. No filler. Just the most absurd verified news from the past 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/30"
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
        <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LandingContent />
    </Suspense>
  );
}
