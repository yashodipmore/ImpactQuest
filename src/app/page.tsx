'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getSupabaseClient } from '@/lib/supabase/client';
import QuestCard from '@/components/quest/QuestCard';
import FilterPanel from '@/components/quest/FilterPanel';
import type { Quest } from '@/types/database';

// Clean SVG Icons
const Icons = {
  MapPin: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Filter: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Bolt: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2"/>
      <path d="M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2"/>
      <path d="M4 22h16"/>
      <path d="M10 22V12a2 2 0 012-2h0a2 2 0 012 2v10"/>
      <path d="M6 3v6a6 6 0 0012 0V3"/>
    </svg>
  ),
  Fire: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
    </svg>
  ),
  Map: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  ),
  List: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
};
const QuestMap = dynamic(() => import('@/components/map/QuestMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-gray-400">Loading map...</div>
    </div>
  ),
});

interface NearbyQuest extends Quest {
  distance_km?: number;
}

export default function HomePage() {
  const [quests, setQuests] = useState<NearbyQuest[]>([]);
  const [filteredQuests, setFilteredQuests] = useState<NearbyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedQuest, setSelectedQuest] = useState<NearbyQuest | null>(null);

  const supabase = getSupabaseClient();

  // Get user location with real-time updates
  useEffect(() => {
    let watchId: number | null = null;
    
    if (navigator.geolocation) {
      // First get current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUserLocation({ lat: 21.1458, lng: 79.0882 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Then watch for updates (real-time tracking)
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Watch position error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    } else {
      setUserLocation({ lat: 21.1458, lng: 79.0882 });
    }

    // Cleanup on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Fetch quests
  const fetchQuests = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all active quests (simpler approach that works without database functions)
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      const questsData = (data as unknown as Quest[]) || [];
      setQuests(questsData);
      setFilteredQuests(questsData);
    } catch (error) {
      console.error('Error fetching quests:', error);
      setQuests([]);
      setFilteredQuests([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (userLocation) {
      fetchQuests();
    }
  }, [userLocation, fetchQuests]);

  // Filter quests
  useEffect(() => {
    let filtered = [...quests];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((q) => q.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(query) ||
          q.description.toLowerCase().includes(query) ||
          q.address.toLowerCase().includes(query)
      );
    }

    setFilteredQuests(filtered);
  }, [quests, selectedCategory, selectedDifficulty, searchQuery]);

  const featuredQuest = filteredQuests.find((q) => q.is_featured);
  const regularQuests = filteredQuests.filter((q) => !q.is_featured);

  return (
    <div className="min-h-screen bg-[#F8F5FF]">
      {/* Hero Section - Soft Gradient */}
      <div className="bg-gradient-to-br from-white via-[#FDFBFF] to-[#F3EEFF]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-[#7C5CFF] to-[#6246E5] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e]">
                ImpactQuest
              </h1>
              <p className="text-[#6B6B8D] text-lg">
                Turn your neighborhood into your quest zone
              </p>
            </div>
          </div>

          {/* Quick Stats - Soft Cards */}
          <div className="flex gap-3 mt-6 flex-wrap">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-2xl px-5 py-3 shadow-sm">
              <span className="text-[#7C5CFF]"><Icons.MapPin /></span>
              <span className="font-medium text-[#1a1a2e]">{filteredQuests.length} quests nearby</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B9D]/10 to-[#FF6B9D]/5 rounded-2xl px-5 py-3">
              <span className="text-[#FF6B9D]"><Icons.Bolt /></span>
              <span className="font-medium text-[#1a1a2e]">Earn XP</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#00D4C8]/10 to-[#00D4C8]/5 rounded-2xl px-5 py-3">
              <span className="text-[#00D4C8]"><Icons.Trophy /></span>
              <span className="font-medium text-[#1a1a2e]">Level Up</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters - Soft Glass */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E0D6F8]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9D9DB8]">
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Search quests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-[#E0D6F8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/20 focus:border-[#7C5CFF] bg-white text-[#1a1a2e] font-medium placeholder:text-[#9D9DB8]"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-2xl transition-all ${
                showFilters 
                  ? 'bg-[#7C5CFF] text-white shadow-lg shadow-purple-500/25' 
                  : 'bg-white border border-[#E0D6F8] text-[#6B6B8D] hover:border-[#7C5CFF] hover:text-[#7C5CFF]'
              }`}
            >
              <Icons.Filter />
            </button>

            {/* View Toggle */}
            <div className="flex bg-white border border-[#E0D6F8] rounded-2xl p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 flex items-center gap-2 font-medium rounded-xl transition-all ${
                  viewMode === 'map' 
                    ? 'bg-[#7C5CFF] text-white shadow-md' 
                    : 'text-[#6B6B8D] hover:text-[#7C5CFF]'
                }`}
              >
                <Icons.Map />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 flex items-center gap-2 font-medium rounded-xl transition-all ${
                  viewMode === 'list' 
                    ? 'bg-[#7C5CFF] text-white shadow-md' 
                    : 'text-[#6B6B8D] hover:text-[#7C5CFF]'
                }`}
              >
                <Icons.List />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <FilterPanel
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedDifficulty={selectedDifficulty}
              setSelectedDifficulty={setSelectedDifficulty}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : (
          <>
            {/* Featured Quest Banner */}
            {featuredQuest && (
              <div className="mb-8 bg-gradient-to-r from-[#FF6B9D] via-[#FF9F43] to-[#FDCB6E] rounded-3xl p-[2px]">
                <div className="bg-white rounded-[22px] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B9D] to-[#FF9F43] rounded-xl flex items-center justify-center text-white">
                      <Icons.Fire />
                    </div>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B9D] to-[#FF9F43] text-lg">QUEST OF THE DAY — 2x XP!</span>
                  </div>
                  <QuestCard
                    quest={featuredQuest}
                    userLocation={userLocation}
                    isFeatured
                  />
                </div>
              </div>
            )}

            {viewMode === 'map' ? (
              /* Map View */
              <div className="h-[60vh] rounded-3xl overflow-hidden shadow-xl shadow-purple-500/10 border border-[#E0D6F8]">
                {userLocation && (
                  <QuestMap
                    quests={filteredQuests}
                    userLocation={userLocation}
                    selectedQuest={selectedQuest}
                    onSelectQuest={setSelectedQuest}
                  />
                )}
              </div>
            ) : (
              /* List View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {regularQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    userLocation={userLocation}
                  />
                ))}
              </div>
            )}

            {/* Selected Quest Detail (from map) */}
            {viewMode === 'map' && selectedQuest && (
              <div className="mt-6">
                <QuestCard
                  quest={selectedQuest}
                  userLocation={userLocation}
                  expanded
                />
              </div>
            )}

            {/* Empty State */}
            {filteredQuests.length === 0 && !loading && (
              <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
                <div className="w-20 h-20 mx-auto bg-[#F3EEFF] rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-[#7C5CFF]"><Icons.Search /></span>
                </div>
                <h3 className="text-xl font-bold text-[#1a1a2e]">No quests found</h3>
                <p className="text-[#6B6B8D] mt-2">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
