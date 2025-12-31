'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { CATEGORY_CONFIG, DIFFICULTY_COLORS } from '@/lib/gamification';
import type { Quest } from '@/types/database';
import { toast } from '@/components/ui/toaster';

// Clean SVG Icons
const Icons = {
  ArrowLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  Clock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Bolt: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Star: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>
  ),
  Navigation: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Camera: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Users: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
};

interface QuestDetailClientProps {
  quest: Quest;
}

export default function QuestDetailClient({ quest }: QuestDetailClientProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const categoryConfig = CATEGORY_CONFIG[quest.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.community;
  const difficultyColor = DIFFICULTY_COLORS[quest.difficulty as keyof typeof DIFFICULTY_COLORS];

  useEffect(() => {
    // Get user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ id: user.id });
        checkIfAccepted(user.id);
      }
    });

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const checkIfAccepted = async (userId: string) => {
    const { data } = await supabase
      .from('user_quests')
      .select('id, status')
      .eq('user_id', userId)
      .eq('quest_id', quest.id)
      .single();

    if (data) {
      setHasAccepted(true);
    }
  };

  const handleAcceptQuest = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/quest/' + quest.id);
      return;
    }

    setIsAccepting(true);
    try {
      const { data, error } = await supabase.from('user_quests').insert({
        user_id: user.id,
        quest_id: quest.id,
        status: 'accepted',
      } as unknown as never).select();

      if (error) {
        console.error('Supabase error details:', error.message, error.code, error.details);
        
        // Handle specific error cases
        if (error.code === '23503' && error.message.includes('profiles')) {
          toast({ message: 'Profile not found. Please log out and sign up again.', type: 'error' });
          return;
        }
        if (error.code === '23505') {
          // Already accepted - this is fine
          setHasAccepted(true);
          toast({ message: 'Quest already accepted!', type: 'success' });
          return;
        }
        throw error;
      }

      console.log('Quest accepted successfully:', data);
      setHasAccepted(true);
      toast({ message: '🎯 Quest accepted! Good luck!', type: 'success' });
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('Error accepting quest:', err.message || error);
      toast({ message: err.message || 'Failed to accept quest', type: 'error' });
    } finally {
      setIsAccepting(false);
    }
  };

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${quest.latitude},${quest.longitude}`;
    window.open(url, '_blank');
  };

  const distance = userLocation
    ? Math.round(
        calculateDistance(
          userLocation.lat,
          userLocation.lng,
          quest.latitude,
          quest.longitude
        ) * 1000
      )
    : null;

  return (
    <div className="min-h-screen bg-[#FAFAFF]">
      {/* Header - Premium Design */}
      <div className="bg-white border-b-2 border-[#2D3436]">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#636E72] hover:text-[#1a1a2e] mb-5 font-medium"
          >
            <Icons.ArrowLeft />
            <span>Back to Quests</span>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <span className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 border-[#2D3436] ${categoryConfig.color} text-white`}>
              {categoryConfig.icon}
            </span>
            <div>
              <span className="text-sm font-bold px-3 py-1 rounded-lg bg-[#F8F7FF] border-2 border-[#2D3436]">
                {categoryConfig.label}
              </span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-4">{quest.title}</h1>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className={`px-3 py-1.5 rounded-lg border-2 border-[#2D3436] font-bold ${difficultyColor}`}>
              {quest.difficulty.toUpperCase()}
            </span>
            {quest.is_featured && (
              <span className="px-3 py-1.5 rounded-lg bg-[#FDCB6E] text-[#2D3436] border-2 border-[#2D3436] font-bold flex items-center gap-1">
                <Icons.Star />
                FEATURED — 2x XP!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Stats Cards - Premium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 text-center border-2 border-[#2D3436]">
            <div className="w-12 h-12 mx-auto bg-[#F8F7FF] rounded-xl flex items-center justify-center mb-2 text-[#6C5CE7]">
              <Icons.Bolt />
            </div>
            <p className="text-2xl font-bold text-[#6C5CE7]">
              +{quest.is_featured ? quest.xp_reward * 2 : quest.xp_reward}
            </p>
            <p className="text-xs font-medium text-[#636E72]">XP Reward</p>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center border-2 border-[#2D3436]">
            <div className="w-12 h-12 mx-auto bg-[#E8F8F5] rounded-xl flex items-center justify-center mb-2 text-[#00B894]">
              <Icons.Clock />
            </div>
            <p className="text-2xl font-bold text-[#00B894]">{quest.estimated_time}</p>
            <p className="text-xs font-medium text-[#636E72]">Minutes</p>
          </div>
          <div className="bg-white rounded-2xl p-5 text-center border-2 border-[#2D3436]">
            <div className="w-12 h-12 mx-auto bg-[#FEF5E7] rounded-xl flex items-center justify-center mb-2 text-[#E17055]">
              <Icons.Users />
            </div>
            <p className="text-2xl font-bold text-[#E17055]">{quest.times_completed}</p>
            <p className="text-xs font-medium text-[#636E72]">Completed</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#2D3436] mb-5">
          <h2 className="font-bold text-[#1a1a2e] mb-3 text-lg">Description</h2>
          <p className="text-[#636E72] leading-relaxed">{quest.description}</p>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#2D3436] mb-5">
          <h2 className="font-bold text-[#1a1a2e] mb-3 text-lg">Location</h2>
          <div className="flex items-center gap-2 text-[#636E72] mb-3">
            <Icons.MapPin />
            <span>{quest.address}</span>
          </div>
          {distance && (
            <p className="text-sm text-[#6C5CE7] font-medium mb-4">
              {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`} from your location
            </p>
          )}
          <button
            onClick={openDirections}
            className="flex items-center gap-2 px-5 py-3 bg-[#F8F7FF] text-[#6C5CE7] rounded-xl border-2 border-[#6C5CE7] font-semibold hover:bg-[#6C5CE7] hover:text-white transition-all"
          >
            <Icons.Navigation />
            Get Directions
          </button>
        </div>

        {/* Requirements */}
        {quest.requirements && quest.requirements.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border-2 border-[#2D3436] mb-5">
            <h2 className="font-bold text-[#1a1a2e] mb-4 text-lg">What You Need</h2>
            <ul className="space-y-3">
              {quest.requirements.map((req, i) => (
                <li key={i} className="flex items-center gap-3 text-[#636E72]">
                  <span className="w-6 h-6 rounded-lg bg-[#E8F8F5] flex items-center justify-center text-[#00B894]">
                    <Icons.Check />
                  </span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Verification Criteria */}
        {quest.verification_criteria && quest.verification_criteria.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border-2 border-[#2D3436] mb-5">
            <h2 className="font-bold text-[#1a1a2e] mb-2 text-lg flex items-center gap-2">
              <Icons.Camera />
              Photo Requirements
            </h2>
            <p className="text-sm text-[#636E72] mb-4">
              Your proof photo should show:
            </p>
            <ul className="space-y-3">
              {quest.verification_criteria.map((criteria, i) => (
                <li key={i} className="flex items-center gap-3 text-[#636E72]">
                  <span className="w-7 h-7 rounded-lg bg-[#F8F7FF] text-[#6C5CE7] text-sm font-bold flex items-center justify-center border-2 border-[#6C5CE7]">
                    {i + 1}
                  </span>
                  {criteria}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons - Premium */}
        <div className="sticky bottom-20 md:bottom-4 bg-white rounded-2xl p-5 border-2 border-[#2D3436] shadow-lg">
          {hasAccepted ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-[#00B894] font-bold">
                <span className="w-6 h-6 rounded-lg bg-[#E8F8F5] flex items-center justify-center">
                  <Icons.Check />
                </span>
                Quest Accepted!
              </div>
              <Link
                href={`/quest/${quest.id}/submit`}
                className="flex items-center justify-center gap-2 w-full py-4 bg-[#6C5CE7] text-white rounded-xl font-bold border-2 border-[#2D3436] hover:bg-[#5541D7] transition-all"
              >
                <Icons.Camera />
                Submit Proof Photo
              </Link>
            </div>
          ) : (
            <button
              onClick={handleAcceptQuest}
              disabled={isAccepting}
              className="w-full py-4 bg-[#6C5CE7] text-white rounded-xl font-bold border-2 border-[#2D3436] hover:bg-[#5541D7] transition-all disabled:opacity-50"
            >
              {isAccepting ? 'Accepting...' : 'Accept Quest'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
