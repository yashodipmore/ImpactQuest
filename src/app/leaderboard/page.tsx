'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { calculateLevelInfo } from '@/lib/gamification';

// Clean SVG Icons
const Icons = {
  Trophy: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2"/>
      <path d="M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2"/>
      <path d="M4 22h16"/>
      <path d="M10 22V12a2 2 0 012-2h0a2 2 0 012 2v10"/>
      <path d="M6 3v6a6 6 0 0012 0V3"/>
    </svg>
  ),
  Bolt: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Target: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Fire: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
    </svg>
  ),
};

interface LeaderboardUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  quests_completed: number;
  current_streak: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchLeaderboard();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, total_xp, level, quests_completed, current_streak')
      .gt('quests_completed', 0)
      .order('total_xp', { ascending: false })
      .limit(100);

    if (data) {
      const profilesData = data as unknown as Array<{
        id: string;
        username: string;
        avatar_url: string | null;
        total_xp: number;
        level: number;
        quests_completed: number;
        current_streak: number;
      }>;
      const rankedData = profilesData.map((user, index) => ({
        user_id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        total_xp: user.total_xp,
        level: user.level,
        quests_completed: user.quests_completed,
        current_streak: user.current_streak,
        rank: index + 1,
      }));
      setLeaders(rankedData);
    }
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-[#FEF5E7] to-[#FFF8F0] border-[#FDCB6E]/50';
      case 2:
        return 'bg-gradient-to-r from-[#F8F5FF] to-[#F5F3FF] border-[#C8C0E8]/50';
      case 3:
        return 'bg-gradient-to-r from-[#FEF5E7] to-[#FFF0EB] border-[#E17055]/30';
      default:
        return 'bg-white border-[#E8E2F4]';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5FF] pb-24">
      {/* Header - Soft Gradient */}
      <div className="bg-gradient-to-r from-white via-[#FAF8FF] to-white border-b border-[#E8E2F4]">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-[#FDCB6E] to-[#E17055] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
              <Icons.Trophy />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-[#1a1a2e]">Leaderboard</h1>
              <p className="text-[#6B6B8D]">Top impact makers in your community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaders.length >= 3 && (
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex justify-center items-end gap-4 mb-8">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="w-18 h-18 rounded-2xl bg-[#F8F5FF] border border-[#E0D6F8] shadow-sm flex items-center justify-center text-3xl mb-3">
                {leaders[1].avatar_url ? (
                  <img src={leaders[1].avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  '🦸'
                )}
              </div>
              <div className="bg-gradient-to-b from-[#F8F5FF] to-white rounded-2xl w-24 py-4 flex flex-col items-center justify-center border border-[#E0D6F8] shadow-sm">
                <span className="text-2xl mb-1">🥈</span>
                <p className="text-sm font-semibold truncate w-full text-center px-2 text-[#1a1a2e]">
                  {leaders[1].username}
                </p>
                <p className="text-xs font-medium text-[#6B6B8D]">{leaders[1].total_xp} XP</p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-4">
              <div className="w-22 h-22 rounded-2xl bg-[#FEF5E7] border border-[#FDCB6E]/50 shadow-lg shadow-amber-500/20 flex items-center justify-center text-4xl mb-3">
                {leaders[0].avatar_url ? (
                  <img src={leaders[0].avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  '👑'
                )}
              </div>
              <div className="bg-gradient-to-br from-[#FDCB6E] to-[#E17055] rounded-2xl w-28 py-5 flex flex-col items-center justify-center shadow-xl shadow-orange-500/30">
                <span className="text-3xl mb-1">🥇</span>
                <p className="text-sm font-semibold truncate w-full text-center px-2 text-white">
                  {leaders[0].username}
                </p>
                <p className="text-xs font-medium text-white/80">{leaders[0].total_xp} XP</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="w-18 h-18 rounded-2xl bg-[#FEF5E7] border border-[#E17055]/30 shadow-sm flex items-center justify-center text-3xl mb-3">
                {leaders[2].avatar_url ? (
                  <img src={leaders[2].avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  '🦸'
                )}
              </div>
              <div className="bg-gradient-to-b from-[#FEF5E7] to-white rounded-2xl w-24 py-4 flex flex-col items-center justify-center border border-[#E17055]/30 shadow-sm">
                <span className="text-2xl mb-1">🥉</span>
                <p className="text-sm font-semibold truncate w-full text-center px-2 text-[#1a1a2e]">
                  {leaders[2].username}
                </p>
                <p className="text-xs font-medium text-[#E17055]">{leaders[2].total_xp} XP</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="max-w-3xl mx-auto px-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-white border border-[#E8E2F4] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E8E2F4] shadow-sm">
            <div className="w-16 h-16 mx-auto bg-[#F8F5FF] rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <Icons.Trophy />
            </div>
            <h3 className="text-xl font-semibold text-[#1a1a2e]">No leaders yet!</h3>
            <p className="text-[#6B6B8D] mt-2">Complete quests to appear on the leaderboard</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((user) => {
              const levelInfo = calculateLevelInfo(user.total_xp);
              const isCurrentUser = user.user_id === currentUserId;

              return (
                <div
                  key={user.user_id}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:shadow-md ${getRankBg(user.rank)} ${
                    isCurrentUser ? 'ring-2 ring-[#7C5CFF]/50 shadow-md shadow-purple-500/10' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 flex justify-center">
                    {getRankIcon(user.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-[#F8F5FF] border border-[#E0D6F8] shadow-sm flex items-center justify-center text-2xl">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      '🦸'
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1a1a2e] truncate">
                        {user.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-[#7C5CFF]/10 text-[#7C5CFF] px-2 py-1 rounded-full font-medium">
                            You
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-[#6B6B8D]">Level {user.level} • {levelInfo.title}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center hidden sm:block">
                      <div className="flex items-center gap-1 text-[#7C5CFF] font-semibold">
                        <Icons.Bolt />
                        {user.total_xp}
                      </div>
                      <p className="text-xs text-[#9B9BB5]">XP</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="flex items-center gap-1 text-[#26DE81] font-semibold">
                        <Icons.Target />
                        {user.quests_completed}
                      </div>
                      <p className="text-xs text-[#9B9BB5]">Quests</p>
                    </div>
                    {user.current_streak > 0 && (
                      <div className="flex items-center gap-1 text-[#FF6B6B] font-semibold">
                        <Icons.Fire />
                        {user.current_streak}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
