'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { NewsStory, PaginatedResponse } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowUp, Clock, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ─── Theme system ─────────────────────────────────────────────

const CARD_THEMES = [
  { gradient: 'from-orange-950 via-orange-900/70 to-amber-950',  accent: 'border-orange-800/60' },
  { gradient: 'from-emerald-950 via-green-900/70 to-teal-950',   accent: 'border-emerald-800/60' },
  { gradient: 'from-blue-950 via-blue-900/70 to-cyan-950',       accent: 'border-blue-800/60' },
  { gradient: 'from-purple-950 via-violet-900/70 to-indigo-950', accent: 'border-purple-800/60' },
  { gradient: 'from-rose-950 via-pink-900/70 to-rose-950',       accent: 'border-rose-800/60' },
  { gradient: 'from-teal-950 via-cyan-900/70 to-sky-950',        accent: 'border-teal-800/60' },
  { gradient: 'from-amber-950 via-yellow-900/70 to-orange-950',  accent: 'border-amber-800/60' },
  { gradient: 'from-indigo-950 via-violet-900/70 to-purple-950', accent: 'border-indigo-800/60' },
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

// ─── Filter config ────────────────────────────────────────────

const MOOD_FILTERS = [
  { id: 'all',      label: 'All Stories',  tags: [],                                                                                               sources: [] },
  { id: 'wtf',      label: 'WTF',          tags: ['wtf','bizarre','absurd','florida-man','nottheonion','facepalm','tifu'],                         sources: [] },
  { id: 'satire',   label: 'Satire',       tags: ['satire','onion','babylon-bee','clickhole','reductress','beaverton','daily-mash','shovel'],      sources: ['onion','babylon','clickhole','beaverton','mash','shovel','whispers','reductress','duffel','hard times'] },
  { id: 'tech',     label: 'Tech',         tags: ['tech','technology','ai','startup','crypto','big-tech','programmer','gizmodo','verge','wired'], sources: ['verge','techcrunch','gizmodo','wired','ars technica','programmer'] },
  { id: 'weed',     label: '420',          tags: ['weed','420','cannabis','marijuana','stoner','trees','ents'],                                    sources: ['merry jane','high times','trees','r/weed','r/ents'] },
  { id: 'animals',  label: 'Animals',      tags: ['animals','bird','bear','alligator','snake','shark','goat','chicken','cow','monkey','raccoon','squirrel','deer','cat','dog'], sources: [] },
  { id: 'science',  label: 'Science',      tags: ['science','space','climate','scientists','research','discovery'],                               sources: [] },
  { id: 'politics', label: 'Politics',     tags: ['politics','government','election','politician','congress','senate','democrat','republican'],    sources: [] },
  { id: 'law',      label: 'Law & Crime',  tags: ['law','crime','lawsuit','arrested','court','police'],                                           sources: [] },
  { id: 'viral',    label: 'Viral',        tags: ['viral','social-media','trending'],                                                              sources: [], minUpvotes: 500 },
];

const SOURCE_FILTERS = [
  { id: 'all',     label: 'All Sources' },
  { id: 'reddit',  label: 'Reddit' },
  { id: 'rss',     label: 'RSS Feeds' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'api',     label: 'News APIs' },
];

const SORT_OPTIONS = [
  { id: 'newest',  label: 'Newest' },
  { id: 'top',     label: 'Most Voted' },
  { id: 'funniest', label: 'Funniest' },
];

// ─── Discover card ────────────────────────────────────────────

function DiscoverCard({ story }: { story: NewsStory }) {
  const theme = getTheme(story);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!story.image_url && !imgFailed;
  const ago = (() => {
    if (!story.published_at) return null;
    try { return formatDistanceToNow(new Date(story.published_at), { addSuffix: true }); } catch { return null; }
  })();

  return (
    <div className="break-inside-avoid mb-4">
      <Link href={`/story/${story.slug}`} className="group block">
        <article className={`rounded-xl overflow-hidden border ${theme.accent} bg-card/20 hover:bg-card/50 hover:border-amber-400/30 hover:shadow-lg hover:shadow-amber-400/[0.04] transition-all duration-200`}>
          {/* Thumbnail — real image or gradient fallback */}
          <div
            className={`relative overflow-hidden ${!showImage ? `bg-gradient-to-br ${theme.gradient}` : 'bg-muted/30'}`}
            style={{ paddingTop: '60%' }}
          >
            {showImage ? (
              <img
                src={story.image_url!}
                alt={story.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:16px_16px]" />
            )}
            {/* Gradient scrim over image so badges are always readable */}
            {showImage && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
            )}
            {/* Funny score */}
            {story.funny_score !== undefined && (
              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 tabular-nums tracking-wider">
                  {story.funny_score}
                </span>
              </div>
            )}
            {/* Source type chip */}
            <div className="absolute bottom-3 left-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/60 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5">
                {story.source_type ?? 'news'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-display font-bold text-sm text-foreground group-hover:text-amber-400 transition-colors line-clamp-3 leading-snug mb-2.5">
              {story.title}
            </h3>

            {story.summary && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                {story.summary}
              </p>
            )}

            {/* Tags */}
            {story.tags && story.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {story.tags.slice(0, 2).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal opacity-70">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border/20 pt-3 text-[10px] text-muted-foreground">
              <span className="truncate max-w-[130px] font-medium">{story.source}</span>
              <div className="flex items-center gap-2 shrink-0">
                {ago && (
                  <span className="hidden sm:flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {ago.replace('about ', '').replace(' ago', '')}
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-green-400 font-semibold">
                  <ArrowUp className="w-2.5 h-2.5" />
                  {(story.upvotes ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────

function MasonrySkeleton() {
  const heights = [220, 280, 200, 260, 240, 210, 290, 230, 250];
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 animate-pulse">
      {heights.map((h, i) => (
        <div key={i} className="break-inside-avoid mb-4 rounded-xl bg-muted/20" style={{ height: h }} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeMood, setActiveMood] = useState('all');
  const [activeSource, setActiveSource] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');
  const [minScore, setMinScore] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    fetch('/api/stories?pageSize=200')
      .then(r => r.json())
      .then((res: PaginatedResponse<NewsStory>) => {
        if (res.success && res.data) setStories(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...stories];

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.summary ?? '').toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q)
      );
    }

    // Source
    if (activeSource !== 'all') {
      result = result.filter(s => s.source_type === activeSource);
    }

    // Funny score
    if (minScore > 0) {
      result = result.filter(s => (s.funny_score ?? 0) >= minScore);
    }

    // Mood
    if (activeMood !== 'all') {
      const mood = MOOD_FILTERS.find(m => m.id === activeMood);
      if (mood) {
        if (mood.minUpvotes) {
          result = result.filter(s => (s.upvotes ?? 0) >= mood.minUpvotes!);
        } else if (mood.tags.length > 0 || mood.sources.length > 0) {
          result = result.filter(s => {
            const st = (s.tags ?? []).map(t => t.toLowerCase());
            const src = (s.source ?? '').toLowerCase();
            const srcType = (s.source_type ?? '').toLowerCase();
            // match by tag OR by source name OR by metadata feed_category
            return (
              mood.tags.some(t => st.includes(t)) ||
              mood.sources.some(ms => src.includes(ms) || srcType.includes(ms)) ||
              (activeMood === 'weed'   && s.category === 'weed') ||
              (activeMood === 'tech'   && (s.category === 'tech' || srcType === 'hackernews')) ||
              (activeMood === 'satire' && s.category === 'satire')
            );
          });
        }
      }
    }

    // Sort
    if (activeSort === 'top') result.sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
    else if (activeSort === 'funniest') result.sort((a, b) => (b.funny_score ?? 0) - (a.funny_score ?? 0));
    else result.sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());

    return result;
  }, [stories, query, activeSource, minScore, activeMood, activeSort]);

  const visible = filtered.slice(0, visibleCount);
  const activeFilterCount = [
    activeMood !== 'all' ? 1 : 0,
    activeSource !== 'all' ? 1 : 0,
    minScore > 0 ? 1 : 0,
    query.trim() ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAll = () => { setActiveMood('all'); setActiveSource('all'); setMinScore(0); setQuery(''); };

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="sticky top-16 z-30 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <h1 className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight leading-tight">
                  Discover Stories
                </h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {loading ? 'Loading…' : `${filtered.length.toLocaleString()} result${filtered.length !== 1 ? 's' : ''}`}
                  {activeFilterCount > 0 && (
                    <span className="text-amber-400 ml-1.5">
                      · {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Sort dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/20 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {SORT_OPTIONS.find(s => s.id === activeSort)?.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border/50 bg-card/95 backdrop-blur shadow-lg z-50">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setActiveSort(opt.id); setSortOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          activeSort === opt.id ? 'bg-amber-400/10 text-amber-400' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all md:hidden ${
                  sidebarOpen || activeFilterCount > 0
                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-400'
                    : 'border-border/50 bg-muted/20 text-muted-foreground'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-amber-400 text-zinc-950 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive flex gap-0 relative">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside
          className={`
            fixed left-0 md:sticky top-[128px] md:top-[128px]
            h-[calc(100vh-128px)] overflow-y-auto
            w-64 shrink-0 z-40 md:z-auto
            border-r border-border/40 bg-background
            transition-transform duration-200 ease-out
            ${sidebarOpen ? 'translate-x-0 shadow-xl md:shadow-none' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="p-5 space-y-7">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search stories…"
                className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-input bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 focus:bg-background transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mood filters */}
            <div>
              <h3 className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-3 px-1">
                Mood
              </h3>
              <div className="space-y-0.5">
                {MOOD_FILTERS.map(mood => (
                  <button
                    key={mood.id}
                    onClick={() => setActiveMood(mood.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all duration-150 ${
                      activeMood === mood.id
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
                    }`}
                  >
                    <span className="font-medium text-sm">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Source filters */}
            <div>
              <h3 className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-3 px-1">
                Source
              </h3>
              <div className="space-y-0.5">
                {SOURCE_FILTERS.map(src => (
                  <button
                    key={src.id}
                    onClick={() => setActiveSource(src.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left text-sm transition-all duration-150 ${
                      activeSource === src.id
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent'
                    }`}
                  >
                    <span className="font-medium">{src.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Funny score slider */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                  Min. Funny Score
                </h3>
                <span className={`text-xs font-mono font-bold tabular-nums ${minScore > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {minScore > 0 ? `${minScore}+` : 'Any'}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={10}
                value={minScore}
                onChange={e => setMinScore(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-1.5 px-0.5">
                <span>Any</span>
                <span>60</span>
                <span>90+</span>
              </div>
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors border border-border/30"
              >
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main content ───────────────────────────────────── */}
        <main className="flex-1 py-7 min-w-0 md:pl-8">
          {loading ? (
            <MasonrySkeleton />
          ) : visible.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-5">🔍</p>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                No stories found
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Try different filters or search terms
              </p>
              <Button size="sm" variant="outline" onClick={clearAll} className="gap-1.5">
                <X className="w-3.5 h-3.5" /> Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
                {visible.map(story => (
                  <DiscoverCard key={story.slug ?? story.url} story={story} />
                ))}
              </div>

              {visibleCount < filtered.length ? (
                <div className="text-center mt-8 pb-4">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(v => v + 15)}
                    className="gap-2 font-semibold border-border/50"
                  >
                    Load More
                    <span className="text-xs text-muted-foreground font-normal">
                      ({filtered.length - visibleCount} remaining)
                    </span>
                  </Button>
                </div>
              ) : filtered.length > 6 ? (
                <p className="text-center text-xs text-muted-foreground/50 mt-8 pb-4">
                  All {filtered.length} stories shown
                </p>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
