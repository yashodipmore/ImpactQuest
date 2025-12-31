'use client';

import Link from 'next/link';
import type { Quest } from '@/types/database';
import { CATEGORY_CONFIG, DIFFICULTY_COLORS } from '@/lib/gamification';

// Clean SVG Icons
const Icons = {
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
  Bolt: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Star: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>
  ),
  Navigation: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

interface QuestCardProps {
  quest: Quest;
  userLocation: { lat: number; lng: number } | null;
  isFeatured?: boolean;
  expanded?: boolean;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
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

export default function QuestCard({
  quest,
  userLocation,
  isFeatured = false,
  expanded = false,
}: QuestCardProps) {
  const categoryConfig = CATEGORY_CONFIG[quest.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.community;
  const difficultyColor = DIFFICULTY_COLORS[quest.difficulty as keyof typeof DIFFICULTY_COLORS];

  const distance = userLocation
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        quest.latitude,
        quest.longitude
      )
    : null;

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${quest.latitude},${quest.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className={`quest-card bg-white rounded-3xl overflow-hidden transition-all hover:shadow-xl hover:shadow-purple-500/10 border border-[#E0D6F8] ${
        isFeatured ? 'ring-2 ring-[#7C5CFF]/30 shadow-lg shadow-purple-500/10' : 'shadow-sm'
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${categoryConfig.color} text-white shadow-md`}
            >
              {categoryConfig.icon}
            </span>
            <div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoryConfig.lightColor}`}>
                {categoryConfig.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${difficultyColor}`}>
              {quest.difficulty.toUpperCase()}
            </span>
            {isFeatured && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#FF9F43] text-white flex items-center gap-1 shadow-md">
                <Icons.Star />
                2x
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-lg text-[#1a1a2e] mb-2">{quest.title}</h3>
        <p className={`text-[#6B6B8D] text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {quest.description}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
          {distance !== null && (
            <div className="flex items-center gap-1.5 text-[#6B6B8D]">
              <Icons.MapPin />
              <span className="font-medium">{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[#6B6B8D]">
            <Icons.Clock />
            <span className="font-medium">{quest.estimated_time} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#7C5CFF] font-bold">
            <Icons.Bolt />
            <span>+{isFeatured ? quest.xp_reward * 2 : quest.xp_reward} XP</span>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-5 pt-5 border-t border-[#E0D6F8]">
            <div className="flex items-center gap-2 text-sm text-[#6B6B8D] mb-3">
              <Icons.MapPin />
              <span>{quest.address}</span>
            </div>
            {quest.requirements && quest.requirements.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#1a1a2e] mb-2">Requirements:</p>
                <ul className="text-sm text-[#6B6B8D] space-y-1">
                  {quest.requirements.map((req, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#26DE81]/10 flex items-center justify-center text-[#26DE81]">
                        <Icons.Check />
                      </span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {quest.times_completed > 0 && (
              <div className="flex items-center gap-2 text-sm text-[#26DE81] font-medium">
                <Icons.Check />
                Completed {quest.times_completed} times
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <Link
            href={`/quest/${quest.id}`}
            className="flex-1 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#6246E5] text-white rounded-xl text-center font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
          >
            View Quest
          </Link>
          <button
            onClick={openDirections}
            className="px-4 py-3 bg-[#F3EEFF] rounded-xl hover:bg-[#EDE7FF] transition-all"
            title="Get Directions"
          >
            <span className="text-[#7C5CFF]"><Icons.Navigation /></span>
          </button>
        </div>
      </div>
    </div>
  );
}
