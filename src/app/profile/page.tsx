'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { calculateLevelInfo, BADGES, getBadgeById, RARITY_COLORS } from '@/lib/gamification';
import type { Profile, UserQuest, Quest } from '@/types/database';

// Clean SVG Icons
const Icons = {
  User: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M20 21a8 8 0 00-16 0"/>
    </svg>
  ),
  Bolt: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  Target: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Award: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

interface UserQuestWithQuest extends UserQuest {
  quests: Quest;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeQuests, setActiveQuests] = useState<UserQuestWithQuest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<UserQuestWithQuest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login?redirect=/profile');
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData as unknown as Profile);
    }

    // Fetch user quests with quest details
    const { data: userQuests } = await supabase
      .from('user_quests')
      .select('*, quests(*)')
      .eq('user_id', user.id)
      .order('accepted_at', { ascending: false });

    if (userQuests) {
      const typedQuests = userQuests as unknown as UserQuestWithQuest[];
      setActiveQuests(typedQuests.filter((uq) => uq.status !== 'completed'));
      setCompletedQuests(typedQuests.filter((uq) => uq.status === 'completed'));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🎯</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F5FF] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl border border-[#E8E2F4] shadow-lg">
          <p className="text-[#6B6B8D] mb-4">Please sign in to view your profile</p>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-[#7C5CFF] text-white rounded-full font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const levelInfo = calculateLevelInfo(profile.total_xp);
  const earnedBadgeIds = profile.badges || [];

  return (
    <div className="min-h-screen bg-[#F8F5FF] pb-24">
      {/* Profile Header - Soft Gradient */}
      <div className="bg-gradient-to-r from-white via-[#FAF8FF] to-white border-b border-[#E8E2F4]">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-24 h-24 rounded-2xl bg-[#F8F5FF] border border-[#E0D6F8] shadow-lg shadow-purple-500/10 flex items-center justify-center text-4xl">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                '🦸'
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#1a1a2e]">{profile.username}</h1>
              <p className="text-[#7C5CFF] font-medium">{levelInfo.title}</p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="bg-gradient-to-r from-[#F8F5FF] to-white rounded-2xl p-5 mb-5 border border-[#E0D6F8]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-[#1a1a2e]">Level {levelInfo.level}</span>
              <span className="text-sm text-[#6B6B8D] font-medium">
                {levelInfo.currentXP} / {levelInfo.xpForNextLevel - levelInfo.xpForCurrentLevel} XP
              </span>
            </div>
            <div className="h-4 bg-white rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#7C5CFF] to-[#A29BFE] progress-fill rounded-full"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 text-center border border-[#E8E2F4] shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 mx-auto bg-[#F8F5FF] rounded-xl flex items-center justify-center mb-2 text-[#7C5CFF]">
                <Icons.Bolt />
              </div>
              <p className="text-xl font-semibold text-[#1a1a2e]">{profile.total_xp}</p>
              <p className="text-xs text-[#6B6B8D] font-medium">Total XP</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-[#E8E2F4] shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 mx-auto bg-[#E8F8F5] rounded-xl flex items-center justify-center mb-2 text-[#26DE81]">
                <Icons.Target />
              </div>
              <p className="text-xl font-semibold text-[#1a1a2e]">{profile.quests_completed}</p>
              <p className="text-xs text-[#6B6B8D] font-medium">Quests</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-[#E8E2F4] shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 mx-auto bg-[#FEF5E7] rounded-xl flex items-center justify-center mb-2 text-[#FF9F43]">
                <Icons.Fire />
              </div>
              <p className="text-xl font-semibold text-[#1a1a2e]">{profile.current_streak}</p>
              <p className="text-xs text-[#6B6B8D] font-medium">Streak</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-[#E8E2F4] shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 mx-auto bg-[#FDCB6E]/20 rounded-xl flex items-center justify-center mb-2 text-[#FDCB6E]">
                <Icons.Award />
              </div>
              <p className="text-xl font-semibold text-[#1a1a2e]">{earnedBadgeIds.length}</p>
              <p className="text-xs text-[#6B6B8D] font-medium">Badges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Badges Section */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8E2F4] shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1a1a2e] flex items-center gap-2">
              <Icons.Award />
              Badges
            </h2>
            <Link href="/badges" className="text-[#7C5CFF] text-sm font-medium">
              View All
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {BADGES.slice(0, 6).map((badge) => {
              const earned = earnedBadgeIds.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex-shrink-0 w-20 text-center ${
                    earned ? '' : 'opacity-40 grayscale'
                  }`}
                >
                  <div
                    className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-3xl mb-1 border ${
                      earned ? RARITY_COLORS[badge.rarity] : 'bg-gray-50 border-[#E8E2F4]'
                    } ${earned ? 'badge-shine shadow-md' : ''}`}
                  >
                    {badge.icon}
                  </div>
                  <p className="text-xs font-medium text-[#1a1a2e] truncate">{badge.name}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Quests */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8E2F4] shadow-sm mb-4">
          <h2 className="font-semibold text-[#1a1a2e] flex items-center gap-2 mb-4">
            <span className="text-[#7C5CFF]"><Icons.Target /></span>
            Active Quests ({activeQuests.length})
          </h2>

          {activeQuests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[#6B6B8D] mb-3">No active quests</p>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-[#7C5CFF] text-white rounded-full font-medium shadow-md shadow-purple-500/20"
              >
                Find Quests
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeQuests.map((uq) => (
                <Link
                  key={uq.id}
                  href={`/quest/${uq.quest_id}`}
                  className="flex items-center justify-between p-3 bg-[#F8F5FF] rounded-xl hover:shadow-md transition-all"
                >
                  <div>
                    <p className="font-medium text-[#1a1a2e]">{uq.quests?.title}</p>
                    <div className="flex items-center gap-3 text-sm text-[#6B6B8D] mt-1">
                      <span className="flex items-center gap-1">
                        <span className="text-[#7C5CFF]"><Icons.Bolt /></span>
                        +{uq.quests?.xp_reward} XP
                      </span>
                      <span className="capitalize px-2 py-0.5 bg-[#FF9F43]/10 text-[#FF9F43] rounded-full text-xs font-medium">
                        {uq.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[#9B9BB5]"><Icons.ChevronRight /></span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Completed Quests */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8E2F4] shadow-sm">
          <h2 className="font-semibold text-[#1a1a2e] flex items-center gap-2 mb-4">
            <span className="text-[#26DE81]"><Icons.Trophy /></span>
            Completed Quests ({completedQuests.length})
          </h2>

          {completedQuests.length === 0 ? (
            <p className="text-[#6B6B8D] text-center py-6">No completed quests yet</p>
          ) : (
            <div className="space-y-3">
              {completedQuests.slice(0, 5).map((uq) => (
                <div
                  key={uq.id}
                  className="flex items-center justify-between p-3 bg-[#26DE81]/5 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-[#1a1a2e]">{uq.quests?.title}</p>
                    <div className="flex items-center gap-3 text-sm text-[#6B6B8D] mt-1">
                      <span className="flex items-center gap-1 text-[#26DE81]">
                        <Icons.Bolt />
                        +{uq.xp_earned} XP earned
                      </span>
                    </div>
                  </div>
                  <span className="text-[#26DE81] text-lg">✓</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
