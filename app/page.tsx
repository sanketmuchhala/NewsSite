'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { NewsStory, Digest, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ArrowUp, Clock,
  Radio, Cpu, GitBranch, FileText,
  Network, BellRing, Headphones, Timer,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ─── Card gradient themes ─────────────────────────────────────

const CARD_THEMES = [
  { gradient: 'from-orange-950 via-orange-900/50 to-amber-950'  },
  { gradient: 'from-emerald-950 via-green-900/50 to-teal-950'   },
  { gradient: 'from-blue-950 via-blue-900/50 to-cyan-950'       },
  { gradient: 'from-purple-950 via-violet-900/50 to-indigo-950' },
  { gradient: 'from-rose-950 via-pink-900/50 to-rose-950'       },
  { gradient: 'from-teal-950 via-cyan-900/50 to-sky-950'        },
  { gradient: 'from-amber-950 via-yellow-900/50 to-orange-950'  },
  { gradient: 'from-indigo-950 via-violet-900/50 to-purple-950' },
];

function slugIndex(slug: string | undefined, len: number): number {
  if (!slug) return 0;
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % len;
}

function getTheme(story: NewsStory) {
  return CARD_THEMES[slugIndex(story.slug, CARD_THEMES.length)];
}

function timeAgo(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return null; }
}

// ─── Agent pipeline data ──────────────────────────────────────

const AGENT_DATA = [
  {
    num: '01',
    icon: Radio,
    name: 'Scrape Agent',
    trigger: 'every 2 hours',
    description:
      'Runs three scrapers in parallel — RSS feeds, Reddit, and Hacker News. Each story\'s URL is hashed into a deterministic slug and checked against Firestore; duplicates are discarded before any LLM call. Every run opens a FeedRun document in Firestore and closes it with per-source counts, AI success rate, and any errors.',
    rows: [
      { k: 'Sources',  v: 'RSS (30+) · Reddit · Hacker News' },
      { k: 'Dedup',    v: 'URL slug lookup in Firestore' },
      { k: 'Writes',   v: 'stories · feed_runs' },
    ],
  },
  {
    num: '02',
    icon: Cpu,
    name: 'LLM Enhancer',
    trigger: 'per new story',
    description:
      'Runs three tasks on each new story in a single parallel call: a 5–7 sentence deadpan summary, 3–5 topic tags, and a Funny Score from 1 to 100. Groq\'s Llama 3.3 70B is the primary model — free-tier, ~5× faster than Gemini. Any Groq error silently falls back to Gemini 2.0 Flash. The ai_model field on each story records exactly which model ran.',
    rows: [
      { k: 'Primary',  v: 'Groq · llama-3.3-70b-versatile' },
      { k: 'Fallback', v: 'Google Gemini 2.0 Flash' },
      { k: 'Tasks',    v: 'summary · tags · funny score' },
    ],
  },
  {
    num: '03',
    icon: GitBranch,
    name: 'Relationship Agent',
    trigger: 'post-scrape',
    description:
      'Runs immediately after each scrape cycle with zero extra LLM calls. Scores every new-story against existing-story pair using three signals: tag Jaccard similarity, title word overlap (stop-words excluded), and a same-source bonus. Pairs above 0.3 are written to story_relationships with a sorted deterministic doc ID — the same pair is always an idempotent upsert. The graph page reads directly from this collection.',
    rows: [
      { k: 'Formula',   v: 'tagOverlap × 0.4 + wordOverlap × 0.3 + sameSource × 0.3' },
      { k: 'Threshold', v: '0.3 — below this, pair is discarded' },
      { k: 'Writes',    v: 'story_relationships' },
    ],
  },
  {
    num: '04',
    icon: FileText,
    name: 'Digest Agent',
    trigger: 'daily at 08:00 UTC',
    description:
      'Selects the top 8 stories by funny_score from the last 48 hours and sends them to the LLM with a specific prompt: write exactly 3 punchy sentences, treat the absurdity as completely normal, be dry not silly. The first sentence becomes the headline. The result is written to digests/YYYY-MM-DD in Firestore and rendered on this page as the amber card above the story feed.',
    rows: [
      { k: 'Source',  v: 'top 8 stories · last 48 hours · by funny_score' },
      { k: 'Prompt',  v: '"deadpan editor · 3 sentences · no exaggeration"' },
      { k: 'Writes',  v: 'digests/YYYY-MM-DD' },
    ],
  },
] as const;

type AgentItem = (typeof AGENT_DATA)[number];

// ─── Roadmap ──────────────────────────────────────────────────

const ROADMAP_ITEMS = [
  {
    icon: BellRing,
    title: 'Real-Time Alerts',
    desc: 'Breaking absurdist news delivered the moment the agent finds it. Configurable by category, source, and minimum Funny Score.',
    status: 'In Development',
  },
  {
    icon: Headphones,
    title: 'Audio Digests',
    desc: 'Daily AI-narrated audio roundups generated automatically from the top stories. Published to a podcast feed every morning without any human involvement.',
    status: 'Planned',
  },
  {
    icon: Network,
    title: 'Personalized Feeds',
    desc: 'The agent learns individual humor preferences over time and builds a personal digest tuned to each user\'s taste — fully automatic, no manual configuration.',
    status: 'Planned',
  },
];

// ─── Ticker fallback headlines ────────────────────────────────

const FALLBACK_HEADLINES = [
  'Florida Man Arrested for Teaching Squirrels to Water Ski',
  'Emotional Support Peacock Denied Entry to Walmart',
  'Scientists Discover Procrastination Gene, Will Study It Later',
  'Woman Sues Neighbor Over Aggressively Cheerful Morning Greetings',
  'Mayor Declares City Pigeon as Official Mascot',
  'Area Man Finally Wins Argument with GPS Navigation System',
  'Town Declares War on Aggressive Geese, Forms Citizen Militia',
  'Man Calls 911 to Report McDonald\'s Ice Cream Machine Is Working',
];

// ─── Components ───────────────────────────────────────────────

function Thumbnail({ story, className }: { story: NewsStory; className?: string }) {
  const theme = getTheme(story);
  return (
    <div className={`bg-gradient-to-br ${theme.gradient} relative overflow-hidden ${className ?? ''}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.035)_1px,transparent_0)] [background-size:16px_16px]" />
      {story.funny_score !== undefined && (
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-md px-2 py-1 border border-white/5">
          <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">
            {story.funny_score}
          </span>
        </div>
      )}
    </div>
  );
}

function Ticker({ items }: { items: string[] }) {
  const all = items.length >= 4 ? items : FALLBACK_HEADLINES;
  const doubled = [...all, ...all];
  return (
    <div className="overflow-hidden bg-zinc-950 border-y border-white/[0.06] py-2.5 select-none">
      <div
        className="flex whitespace-nowrap will-change-transform"
        style={{ animation: 'marquee 52s linear infinite' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-4 px-7 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40"
          >
            <span className="w-1 h-1 rounded-full bg-amber-400/50 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 1400) {
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

function FeaturedCard({ story }: { story: NewsStory }) {
  const ago = timeAgo(story.published_at);
  return (
    <div className="grid lg:grid-cols-5 overflow-hidden rounded-xl border border-border/40 bg-card/10 group hover:border-border/70 transition-colors duration-200">
      <Thumbnail story={story} className="lg:col-span-2 min-h-[200px] lg:min-h-0" />

      <div className="lg:col-span-3 p-6 md:p-9 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <span className="inline-flex items-center h-5 px-2 rounded border border-amber-400/25 bg-amber-400/8 text-[9px] font-bold uppercase tracking-widest text-amber-400">
              Top Story
            </span>
            {ago && (
              <span className="text-xs text-muted-foreground/50 flex items-center gap-1.5 font-mono">
                <Clock className="w-3 h-3" />{ago}
              </span>
            )}
          </div>
          <Link href={`/story/${story.slug}`}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight hover:text-amber-400 transition-colors duration-150 mb-4 text-balance">
              {story.title}
            </h2>
          </Link>
          {story.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6 text-pretty">
              {story.summary}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between pt-5 border-t border-border/25">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 text-green-400 font-semibold tabular-nums">
              <ArrowUp className="w-3.5 h-3.5" />
              {(story.upvotes ?? 0).toLocaleString()}
            </span>
            {story.view_count ? (
              <span className="tabular-nums">
                {story.view_count >= 1000
                  ? `${(story.view_count / 1000).toFixed(1)}k views`
                  : `${story.view_count} views`}
              </span>
            ) : null}
            <span className="font-mono text-amber-400/60">
              Score {story.funny_score ?? 70}
            </span>
          </div>
          <div className="flex gap-2">
            <Link href={`/story/${story.slug}`}>
              <Button
                size="sm"
                className="bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold text-xs h-8 px-4"
              >
                Read Story
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1 hidden sm:flex h-8 border-border/40 hover:border-border/70"
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

function MiniCard({ story }: { story: NewsStory }) {
  return (
    <Link href={`/story/${story.slug}`} className="group block">
      <div className="rounded-xl overflow-hidden border border-border/30 bg-card/5 hover:border-border/60 hover:bg-card/20 transition-all duration-150">
        <Thumbnail story={story} className="h-28 w-full" />
        <div className="p-4">
          <h3 className="font-display font-bold text-[13px] leading-snug mb-2.5 text-foreground group-hover:text-amber-400 transition-colors line-clamp-2">
            {story.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/50 font-mono truncate max-w-[100px]">
              {story.source}
            </span>
            <span className="flex items-center gap-0.5 text-green-400 font-semibold text-[10px] tabular-nums shrink-0">
              <ArrowUp className="w-2.5 h-2.5" />
              {(story.upvotes ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DigestCard({ digest, stories }: { digest: Digest; stories: NewsStory[] }) {
  const storyMap = new Map(stories.map(s => [s.slug, s]));
  const linked = digest.story_slugs
    .map(slug => storyMap.get(slug))
    .filter((s): s is NewsStory => !!s)
    .slice(0, 4);

  return (
    <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.03] overflow-hidden mb-12">
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-amber-400/12">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-400">Daily Digest</span>
        <span className="text-[9px] font-mono text-muted-foreground/35">{digest.date}</span>
        <div className="h-px flex-1 bg-amber-400/12" />
        <span className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-wider">
          {digest.model?.replace('groq/', '').replace('-versatile', '') ?? 'AI-generated'}
        </span>
      </div>

      <div className="px-6 pt-5 pb-6">
        <h3 className="font-display font-bold text-lg md:text-xl text-foreground mb-3 leading-tight text-balance">
          {digest.headline}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 text-pretty max-w-3xl">
          {digest.content}
        </p>

        {linked.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {linked.map(s => (
              <Link
                key={s.slug}
                href={`/story/${s.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-amber-400/8 text-amber-400/80 hover:bg-amber-400/15 hover:text-amber-400 border border-amber-400/15 hover:border-amber-400/30 transition-all duration-150"
              >
                {s.title.length > 52 ? s.title.slice(0, 52) + '…' : s.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-56 rounded-xl bg-muted/15" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-muted/10" />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentItem }) {
  const Icon = agent.icon;
  return (
    <div className="relative rounded-xl border border-border/35 bg-card/5 p-6 md:p-7 hover:border-border/60 hover:bg-card/15 transition-all duration-200 group flex flex-col">
      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <span className="font-mono text-[10px] font-bold text-muted-foreground/25 tracking-[0.2em] uppercase">
          {agent.num}
        </span>
        <div className="w-8 h-8 rounded-lg border border-border/35 bg-muted/15 flex items-center justify-center group-hover:border-amber-400/25 group-hover:bg-amber-400/5 transition-all duration-200">
          <Icon className="w-[15px] h-[15px] text-amber-400/50 group-hover:text-amber-400/80 transition-colors" />
        </div>
      </div>

      {/* Name + trigger */}
      <div className="mb-4">
        <h3 className="font-display font-bold text-foreground text-[15px] uppercase tracking-[0.04em] mb-1.5">
          {agent.name}
        </h3>
        <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.16em] text-amber-400/55">
          {agent.trigger}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1 text-pretty">
        {agent.description}
      </p>

      {/* Data rows */}
      <div className="space-y-2.5 pt-4 border-t border-border/25">
        {agent.rows.map((row) => (
          <div key={row.k} className="flex items-start gap-3">
            <span className="text-[8.5px] font-bold uppercase tracking-widest text-muted-foreground/30 mt-px w-16 shrink-0 leading-4">
              {row.k}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground/65 leading-snug">
              {row.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category filter ──────────────────────────────────────────

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

// ─── Main page ────────────────────────────────────────────────

const CATEGORIES = ['All', 'WTF', 'Animals', 'Satire', 'Science', 'Politics', 'Tech'];

function LandingContent() {
  const [stories,         setStories]         = useState<NewsStory[]>([]);
  const [digest,          setDigest]          = useState<Digest | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [activeCategory,  setActiveCategory]  = useState('All');
  const [totalStories,    setTotalStories]     = useState(0);

  const countedTotal = useCountUp(totalStories);

  useEffect(() => {
    const storiesP = fetch('/api/stories?pageSize=100')
      .then(r => r.json())
      .then((res: PaginatedResponse<NewsStory>) => {
        if (res.success && res.data) {
          setStories(res.data);
          setTotalStories(res.pagination?.total ?? res.data.length);
        }
      })
      .catch(console.error);

    const digestP = fetch('/api/digest')
      .then(r => r.json())
      .then((res: { success: boolean; data?: Digest }) => {
        if (res.success && res.data) setDigest(res.data);
      })
      .catch(() => {});

    Promise.all([storiesP, digestP]).finally(() => setLoading(false));
  }, []);

  const filtered      = filterByCategory(stories, activeCategory);
  const featured      = filtered[0];
  const gridStories   = filtered.slice(1, 7);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-56px)] flex flex-col justify-center overflow-hidden bg-background">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:26px_26px] opacity-35 pointer-events-none" />
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="container-responsive relative z-10 py-20 md:py-28">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2.5 mb-10 px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.04]"
            style={{ animation: 'heroIn 0.7s ease both' }}
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">
              4 agents running
            </span>
            <span className="w-px h-3 bg-amber-400/20" />
            <span className="text-[10px] text-muted-foreground/60 tracking-wide">no human editors</span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-black tracking-tighter leading-[0.88] mb-8 text-balance"
            style={{ fontSize: 'clamp(3rem, 9vw, 8.5rem)', animation: 'heroIn 0.9s 0.08s ease both' }}
          >
            <span className="block text-foreground">An AI Agent That</span>
            <span className="block text-foreground">Finds the Funniest</span>
            <em className="block text-amber-400 not-italic">News Online.</em>
          </h1>

          {/* Description */}
          <div style={{ animation: 'heroIn 0.9s 0.2s ease both' }} className="max-w-2xl mb-10 space-y-3">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed text-pretty">
              Four autonomous agents run continuously on a Railway server. Every two hours, the Scrape Agent
              pulls from over 30 RSS feeds, Reddit, and Hacker News — deduplicating by URL and passing new
              stories to an LLM Enhancer. Groq&apos;s Llama&nbsp;3.3&nbsp;70B reads each article, generates a
              deadpan summary, tags it, and assigns a Funny Score from 1 to 100.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
              After every scrape, a Relationship Agent maps story connections algorithmically — no extra
              LLM calls — and writes graph edges to Firestore. Every morning at 8&nbsp;AM, a Digest Agent
              picks the top&nbsp;8 stories and writes a 3-sentence roundup. No human involvement at any step.
            </p>
            <p className="text-sm text-muted-foreground/50 font-mono">
              This is what they found.
            </p>
          </div>

          {/* CTAs */}
          <div
            className="flex flex-wrap gap-3 mb-16"
            style={{ animation: 'heroIn 0.9s 0.32s ease both' }}
          >
            <Button
              size="lg"
              className="bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold px-8 text-sm h-11"
              onClick={() => document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Read Today&apos;s Stories
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-semibold px-8 text-sm h-11 border-border/40 gap-2 hover:border-border/70"
              onClick={() => document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How It Works <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Stats strip */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-0 pt-7 border-t border-border/25"
            style={{ animation: 'heroIn 0.9s 0.44s ease both' }}
          >
            {[
              { label: 'Stories Indexed',  value: countedTotal > 0 ? countedTotal.toLocaleString() : '—' },
              { label: 'Scrape Interval',  value: 'Every 2h' },
              { label: 'Funny Score Range',value: '1 – 100' },
              { label: 'Active Agents',    value: '4' },
            ].map(({ label, value }) => (
              <div key={label} className="py-5 pr-8 border-r border-border/15 last:border-r-0">
                <p className="font-display font-black text-2xl md:text-3xl text-foreground tabular-nums mb-1">
                  {value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground/20"
          style={{ animation: 'heroIn 1s 0.7s ease both' }}
        >
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-muted-foreground/20" />
          <span className="text-[8px] font-mono uppercase tracking-[0.25em]">scroll</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TICKER
      ════════════════════════════════════════════════════════ */}
      <Ticker items={stories.map(s => s.title)} />

      {/* ═══════════════════════════════════════════════════════
          STORIES
      ════════════════════════════════════════════════════════ */}
      <section id="stories" className="section-padding border-b border-border/25">
        <div className="container-responsive">

          {loading ? (
            <Skeleton />
          ) : (
            <>
              {/* Digest card */}
              {digest && <DigestCard digest={digest} stories={stories} />}

              {/* Featured story */}
              {featured && (
                <div className="mb-14">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-400">
                      Top Story Right Now
                    </span>
                    <div className="h-px flex-1 bg-border/25" />
                  </div>
                  <FeaturedCard story={featured} />
                </div>
              )}

              {/* Grid */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">
                    Latest from the Agent
                  </span>
                  <Link
                    href="/discover"
                    className="text-xs text-muted-foreground hover:text-amber-400 transition-colors flex items-center gap-1 self-end sm:self-auto"
                  >
                    Browse all in Discover <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Category filter */}
                <div className="flex flex-wrap gap-1.5 mb-7">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 ${
                        activeCategory === cat
                          ? 'bg-amber-400 text-zinc-950'
                          : 'bg-muted/15 text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-border/25 hover:border-border/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {gridStories.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gridStories.map((story, i) => (
                      <div
                        key={story.slug ?? story.url}
                        style={{ animation: `heroIn 0.5s ${i * 0.055}s ease both` }}
                      >
                        <MiniCard story={story} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground/50 text-sm py-12">
                    No stories in this category yet.
                  </p>
                )}

                {stories.length > 7 && (
                  <div className="text-center mt-10">
                    <Link href="/discover">
                      <Button
                        variant="outline"
                        className="gap-2 font-semibold border-border/35 hover:border-border/60"
                      >
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

      {/* ═══════════════════════════════════════════════════════
          AGENT PIPELINE
      ════════════════════════════════════════════════════════ */}
      <section id="pipeline" className="section-padding border-b border-border/25 bg-muted/[0.04]">
        <div className="container-responsive">

          {/* Section header */}
          <div className="mb-12 md:mb-14">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-3">
              How It Works
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              The Agent Pipeline
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed text-pretty">
              Four specialized agents run inside a Railway container. Each has a defined trigger,
              reads from specific sources, and writes to a specific Firestore collection.
              They hand off to each other in sequence — no orchestration layer required.
            </p>
          </div>

          {/* Agent cards 2×2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-10">
            {AGENT_DATA.map(agent => (
              <AgentCard key={agent.num} agent={agent} />
            ))}
          </div>

          {/* Data flow strip */}
          <div className="rounded-xl border border-border/25 bg-card/5 px-6 py-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30 mb-3">
              Data Flow
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              {[
                { text: 'Sources',             accent: false },
                { text: '→',                   accent: false, dim: true  },
                { text: 'Scrape Agent',         accent: false },
                { text: '→',                   accent: false, dim: true  },
                { text: 'LLM Enhancer',         accent: false },
                { text: '→',                   accent: false, dim: true  },
                { text: 'stories',              accent: true  },
                { text: '→',                   accent: false, dim: true  },
                { text: 'Relationship Agent',   accent: false },
                { text: '→',                   accent: false, dim: true  },
                { text: 'story_relationships',  accent: true  },
              ].map((item, i) => (
                <span
                  key={i}
                  className={
                    item.accent
                      ? 'text-amber-400/60 bg-amber-400/8 border border-amber-400/15 px-2 py-0.5 rounded'
                      : item.dim
                      ? 'text-muted-foreground/20'
                      : 'text-muted-foreground/50'
                  }
                >
                  {item.text}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono mt-2">
              {[
                { text: 'stories',         accent: true  },
                { text: '→',              accent: false, dim: true  },
                { text: 'Digest Agent',    accent: false },
                { text: '→',              accent: false, dim: true  },
                { text: 'digests/YYYY-MM-DD', accent: true },
                { text: '→',              accent: false, dim: true  },
                { text: 'Homepage card',   accent: false },
              ].map((item, i) => (
                <span
                  key={i}
                  className={
                    item.accent
                      ? 'text-amber-400/60 bg-amber-400/8 border border-amber-400/15 px-2 py-0.5 rounded'
                      : item.dim
                      ? 'text-muted-foreground/20'
                      : 'text-muted-foreground/50'
                  }
                >
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STATS
      ════════════════════════════════════════════════════════ */}
      <section className="section-padding border-b border-border/25">
        <div className="container-responsive">
          <div className="flex items-center gap-4 mb-10">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Agent Activity
            </p>
            <div className="h-px flex-1 bg-border/25" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-border/30 rounded-xl overflow-hidden">
            {[
              { label: 'Sources Monitored',   value: '30+',                              sub: 'RSS, Reddit, HN' },
              { label: 'Scrapes per Day',      value: '12',                               sub: 'every 2 hours, 24/7' },
              { label: 'Avg Funny Score',      value: totalStories > 0 ? '74' : '—',     sub: 'out of 100' },
              { label: 'Stories Indexed',      value: countedTotal > 0 ? countedTotal.toLocaleString() : '—', sub: 'and counting' },
            ].map(({ label, value, sub }, i) => (
              <div
                key={label}
                className={`p-7 md:p-9 ${i < 3 ? 'border-b lg:border-b-0 border-r border-border/25' : ''}`}
              >
                <p className="font-display font-black text-4xl md:text-5xl text-foreground tabular-nums mb-2">
                  {value}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 mb-1">
                  {label}
                </p>
                <p className="text-[10px] text-muted-foreground/40">{sub}</p>
              </div>
            ))}
          </div>

          {/* Status bar */}
          <div className="mt-5 rounded-xl border border-border/25 bg-card/5 px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-400">
                System Running
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex-1 leading-relaxed">
              The pipeline is live on Railway. Scrape and digest cron jobs fire on schedule.
              FeedRun logs are written to Firestore after each cycle.
            </p>
            <Link href="/graph" className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-border/35 hover:border-border/60"
              >
                View Story Network <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          ROADMAP
      ════════════════════════════════════════════════════════ */}
      <section className="section-padding">
        <div className="container-responsive">
          <div className="mb-12">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-3">
              Roadmap
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              What the Agent Learns Next
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed text-pretty">
              The current pipeline scrapes, scores, graphs, and digests. The next phase adds
              delivery, personalization, and real-time capability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {ROADMAP_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-border/30 bg-card/5 p-6 hover:border-border/55 hover:bg-card/15 transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="w-9 h-9 rounded-lg border border-border/35 bg-muted/15 flex items-center justify-center group-hover:border-amber-400/20 transition-colors">
                      <Icon className="w-4 h-4 text-amber-400/50 group-hover:text-amber-400/70 transition-colors" />
                    </div>
                    <span className={`text-[8.5px] font-bold uppercase tracking-[0.16em] px-2 py-1 rounded border ${
                      item.status === 'In Development'
                        ? 'border-blue-400/20 text-blue-400/80 bg-blue-400/5'
                        : 'border-border/30 text-muted-foreground/40 bg-muted/10'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LandingContent />
    </Suspense>
  );
}
