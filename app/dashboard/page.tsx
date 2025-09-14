'use client';

import { useState, useEffect } from 'react';
import { NewsStory, PaginatedResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import LoginForm from '@/components/LoginForm';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Globe, 
  RefreshCw, 
  Calendar,
  Target,
  Zap,
  Activity,
  Clock,
  Settings,
  Database,
  Server,
  AlertCircle,
  LogOut
} from 'lucide-react';

interface DashboardStats {
  totalStories: number;
  todayStories: number;
  trendingStories: number;
  avgFunnyScore: number;
  totalUpvotes: number;
  topTags: { tag: string; count: number }[];
  topSources: { source: string; count: number }[];
  recentActivity: string[];
  systemStatus: {
    database: 'connected' | 'disconnected';
    scraper: 'active' | 'idle' | 'error';
    lastScrape: string;
    nextScrape: string;
  };
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStories: 0,
    todayStories: 0,
    trendingStories: 0,
    avgFunnyScore: 0,
    totalUpvotes: 0,
    topTags: [],
    topSources: [],
    recentActivity: [],
    systemStatus: {
      database: 'connected',
      scraper: 'idle',
      lastScrape: 'Never',
      nextScrape: 'Manual'
    }
  });
  const [recentStories, setRecentStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/stories?pageSize=50');
      const result: PaginatedResponse<NewsStory> = await response.json();
      
      if (result.success && result.data) {
        const stories = result.data;
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayStories = stories.filter(story => {
          const storyDate = new Date(story.created_at || story.published_at || '');
          return storyDate >= today;
        });

        const totalUpvotes = stories.reduce((sum, story) => sum + (story.upvotes || 0), 0);
        const avgFunnyScore = stories.length > 0 
          ? stories.reduce((sum, story) => sum + (story.funny_score || 50), 0) / stories.length
          : 50;
        
        // Calculate top tags
        const tagCounts: { [key: string]: number } = {};
        stories.forEach(story => {
          story.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        const topTags = Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8)
          .map(([tag, count]) => ({ tag, count }));

        // Calculate top sources  
        const sourceCounts: { [key: string]: number } = {};
        stories.forEach(story => {
          sourceCounts[story.source] = (sourceCounts[story.source] || 0) + 1;
        });
        const topSources = Object.entries(sourceCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([source, count]) => ({ source, count }));

        setStats(prev => ({
          ...prev,
          totalStories: stories.length,
          todayStories: todayStories.length,
          trendingStories: stories.filter(s => (s.upvotes || 0) > 10).length,
          avgFunnyScore: Math.round(avgFunnyScore),
          totalUpvotes,
          topTags,
          topSources,
          recentActivity: [
            `${todayStories.length} new stories added today`,
            `${totalUpvotes} total upvotes received`,
            `Average content score: ${Math.round(avgFunnyScore)}`,
            `Most active source: ${topSources[0]?.source || 'N/A'}`,
            `Database status: Connected`
          ]
        }));

        setRecentStories(stories.slice(0, 8));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats(prev => ({
        ...prev,
        systemStatus: {
          ...prev.systemStatus,
          database: 'disconnected'
        }
      }));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const runScraper = async () => {
    setIsScrapingInProgress(true);
    setStats(prev => ({
      ...prev,
      systemStatus: {
        ...prev.systemStatus,
        scraper: 'active'
      }
    }));

    try {
      console.log('Starting scraper from dashboard...');
      
      const response = await fetch('/api/scrape/run', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          maxPerSource: 10,
          timestamp: new Date().toISOString()
        })
      });
      
      console.log('Scraper response status:', response.status);
      const result = await response.json();
      console.log('Scraper response data:', result);
      
      if (response.ok && result.success) {
        setStats(prev => ({
          ...prev,
          systemStatus: {
            ...prev.systemStatus,
            lastScrape: new Date().toLocaleTimeString()
          }
        }));
        
        // Show detailed success message in activity
        const successMessage = result.results ? 
          `Scraping completed: ${result.results.success} stories saved, ${result.results.failed} failed` : 
          `Scraping completed: ${result.message || 'Success'}`;
          
        setStats(prev => ({
          ...prev,
          recentActivity: [
            successMessage,
            ...prev.recentActivity.slice(0, 3)
          ]
        }));
        
        // Refresh dashboard after scraper runs
        setTimeout(() => {
          handleRefresh();
        }, 3000);
      } else {
        const errorMessage = result.error || result.details || 'Unknown error';
        console.error('Scraper failed:', errorMessage);
        
        setStats(prev => ({
          ...prev,
          systemStatus: {
            ...prev.systemStatus,
            scraper: 'error'
          },
          recentActivity: [
            `Scraping failed: ${errorMessage}`,
            ...prev.recentActivity.slice(0, 3)
          ]
        }));
      }
    } catch (error) {
      console.error('Failed to run scraper:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      
      setStats(prev => ({
        ...prev,
        systemStatus: {
          ...prev.systemStatus,
          scraper: 'error'
        },
        recentActivity: [
          `Scraping failed: ${errorMessage}`,
          ...prev.recentActivity.slice(0, 3)
        ]
      }));
    } finally {
      setIsScrapingInProgress(false);
      setTimeout(() => {
        setStats(prev => ({
          ...prev,
          systemStatus: {
            ...prev.systemStatus,
            scraper: 'idle'
          }
        }));
      }, 5000);
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // Show loading for dashboard data
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="h-8 bg-muted rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">System monitoring and content management</p>
          </div>
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stats.systemStatus.database === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">Database</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                stats.systemStatus.scraper === 'active' ? 'bg-yellow-500' : 
                stats.systemStatus.scraper === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm text-muted-foreground">Scraper</span>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={runScraper} 
              disabled={isScrapingInProgress}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              {isScrapingInProgress ? 'Scraping...' : 'Run Scraper'}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* System Status Alert */}
        {stats.systemStatus.database === 'disconnected' && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Database Connection Issue</p>
              <p className="text-sm text-muted-foreground">Unable to connect to the database. Some features may be limited.</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Stories</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalStories}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Stories</p>
                <p className="text-3xl font-bold text-foreground">{stats.todayStories}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Content Score</p>
                <p className="text-3xl font-bold text-foreground">{stats.avgFunnyScore}</p>
                <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Engagement</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalUpvotes}</p>
                <p className="text-xs text-muted-foreground mt-1">Community votes</p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Stories Management */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Recent Stories</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{recentStories.length} stories</Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {recentStories.map((story) => (
                  <div key={story.id} className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground line-clamp-2 mb-2">
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="truncate">{story.source}</span>
                        <span>•</span>
                        <span>Score: {story.funny_score || 50}</span>
                        <span>•</span>
                        <span>{story.upvotes || 0} votes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={story.funny_score && story.funny_score > 75 ? "default" : "secondary"}>
                        {story.funny_score || 50}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* System Status */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant={stats.systemStatus.database === 'connected' ? "default" : "destructive"}>
                    {stats.systemStatus.database}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Scraper</span>
                  <Badge variant={
                    stats.systemStatus.scraper === 'active' ? "default" : 
                    stats.systemStatus.scraper === 'error' ? "destructive" : "secondary"
                  }>
                    {stats.systemStatus.scraper}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Scrape</span>
                  <span className="text-sm text-muted-foreground">{stats.systemStatus.lastScrape}</span>
                </div>
              </div>
            </Card>

            {/* Top Sources */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Source Management</h3>
              <div className="space-y-3">
                {stats.topSources.map((source) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">
                      {source.source}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{source.count}</span>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Activity Monitor */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Activity
              </h3>
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{activity}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}