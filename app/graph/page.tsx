'use client';

import { useState } from 'react';
import NetworkGraph from '@/components/NetworkGraph';
import Link from 'next/link';
import { ArrowLeft, X, Network } from 'lucide-react';

export default function GraphPage() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Sub-header ────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Link>

              <div className="h-4 w-px bg-border/50 shrink-0" />

              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-amber-400/20 bg-amber-400/5 shrink-0">
                  <Network className="w-4 h-4 text-amber-400/70" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight leading-tight">
                    Story Network
                  </h1>
                  <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                    The agent maps relationships between stories automatically
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/10 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-amber-400/30 transition-all shrink-0"
            >
              <span className="w-4 h-4 flex items-center justify-center rounded-full border border-current text-[10px] font-bold">?</span>
              Guide
            </button>
          </div>
        </div>
      </div>

      {/* ── Network ───────────────────────────────────────────── */}
      <div className="flex-1 p-4 md:p-6">
        <NetworkGraph className="w-full" />
      </div>

      {/* ── Guide modal ───────────────────────────────────────── */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowGuide(false); }}
        >
          <div className="relative w-full max-w-md mx-4 rounded-xl border border-border/60 bg-card/98 shadow-2xl overflow-hidden"
            style={{ animation: 'heroIn 0.2s ease both' }}
          >
            {/* Amber top stripe */}
            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">Network Guide</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    How to read and interact with the story graph
                  </p>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-amber-400 mb-2">
                    Reading the Graph
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                    <p>Each circle represents a news story discovered by the agent. Node size reflects the Funny Score — larger means funnier.</p>
                    <p>Connecting lines show relationships the agent detected automatically across sources.</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-amber-400 mb-2">
                    Node Colors
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { color: 'bg-orange-500', label: 'Reddit' },
                      { color: 'bg-blue-500',   label: 'RSS Feeds' },
                      { color: 'bg-sky-400',    label: 'Twitter' },
                      { color: 'bg-purple-500', label: 'API Sources' },
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-amber-400 mb-2">
                    Controls
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {[
                      ['Click node',  'Open story details'],
                      ['Drag node',   'Reposition freely'],
                      ['Scroll',      'Zoom in and out'],
                      ['Fit View',    'Reset the viewport'],
                      ['Random',      'Jump to any node'],
                      ['Funniest',    'Focus top story'],
                    ].map(([action, desc]) => (
                      <div key={action} className="flex gap-1.5 text-xs">
                        <span className="font-semibold text-foreground shrink-0">{action}</span>
                        <span className="text-muted-foreground">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowGuide(false)}
                className="mt-6 w-full h-9 rounded-lg bg-amber-400 text-zinc-950 font-bold text-sm hover:bg-amber-300 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
