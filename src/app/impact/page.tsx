'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Leaf,
  Heart,
  UtensilsCrossed,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface CommunityStats {
  total_quests_completed: number;
  total_trash_collected_kg: number;
  total_trees_planted: number;
  total_elderly_helped: number;
  total_meals_rescued: number;
  total_hours_volunteered: number;
}

interface CategoryStats {
  category: string;
  count: number;
}

const IMPACT_CARDS = [
  {
    icon: Leaf,
    label: 'Trash Collected',
    key: 'total_trash_collected_kg',
    suffix: 'kg',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: Heart,
    label: 'Elderly Helped',
    key: 'total_elderly_helped',
    suffix: '',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
  },
  {
    icon: UtensilsCrossed,
    label: 'Meals Rescued',
    key: 'total_meals_rescued',
    suffix: '',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Clock,
    label: 'Hours Volunteered',
    key: 'total_hours_volunteered',
    suffix: 'hrs',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
  },
];

const CATEGORY_INFO = {
  environment: { icon: '🌱', label: 'Environment', color: 'bg-green-500' },
  elderly_care: { icon: '👴', label: 'Elderly Care', color: 'bg-pink-500' },
  food_rescue: { icon: '🍽️', label: 'Food Rescue', color: 'bg-orange-500' },
  education: { icon: '📚', label: 'Education', color: 'bg-blue-500' },
  community: { icon: '🤝', label: 'Community', color: 'bg-purple-500' },
};

export default function ImpactPage() {
  const supabase = getSupabaseClient();
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [recentQuests, setRecentQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch community stats
    const { data: communityData } = await supabase
      .from('community_stats')
      .select('*')
      .single();

    if (communityData) {
      setStats(communityData as CommunityStats);
    }

    // Fetch category breakdown from completed quests
    const { data: questData } = await supabase
      .from('user_quests')
      .select('quest_id, quests(category)')
      .eq('status', 'completed');

    if (questData) {
      const categoryCount: Record<string, number> = {};
      questData.forEach((uq: any) => {
        const cat = uq.quests?.category;
        if (cat) {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        }
      });
      setCategoryStats(
        Object.entries(categoryCount).map(([category, count]) => ({
          category,
          count,
        }))
      );
    }

    // Fetch recent completed quests
    const { data: recentData } = await supabase
      .from('user_quests')
      .select('*, quests(title, category, xp_reward), profiles(username, avatar_url)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    if (recentData) {
      setRecentQuests(recentData);
    }

    setLoading(false);
  };

  const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [value]);

    return (
      <span>
        {count.toLocaleString()}
        {suffix}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >
            🌍
          </motion.div>
          <p className="text-gray-600">Loading community impact...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
              <Sparkles size={16} />
              <span className="text-sm font-medium">Community Impact</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Together, We're Making a
              <span className="block mt-2 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Real Difference
              </span>
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Every quest completed is a step towards a better community. See the impact we've made together.
            </p>
          </motion.div>

          {/* Main Counter */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <div className="inline-block bg-white/10 backdrop-blur-lg rounded-3xl p-8">
              <div className="text-6xl md:text-8xl font-bold">
                <AnimatedCounter value={stats?.total_quests_completed || 0} />
              </div>
              <p className="text-xl text-purple-200 mt-2">Quests Completed</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Impact Cards */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {IMPACT_CARDS.map((card, index) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                <card.icon className={`text-${card.color.split('-')[1]}-500`} size={24} />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                <AnimatedCounter 
                  value={(stats as any)?.[card.key] || 0} 
                  suffix={card.suffix} 
                />
              </div>
              <p className="text-gray-600 mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="text-purple-600" />
          Impact by Category
        </h2>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          {categoryStats.length > 0 ? (
            <div className="space-y-4">
              {categoryStats.map((cat, index) => {
                const info = CATEGORY_INFO[cat.category as keyof typeof CATEGORY_INFO] || {
                  icon: '📋',
                  label: cat.category,
                  color: 'bg-gray-500',
                };
                const maxCount = Math.max(...categoryStats.map((c) => c.count));
                const percentage = (cat.count / maxCount) * 100;

                return (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.icon}</span>
                        <span className="font-medium text-gray-900">{info.label}</span>
                      </div>
                      <span className="font-bold text-gray-900">{cat.count} quests</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.2 * index }}
                        className={`h-full ${info.color} rounded-full`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No quests completed yet. Be the first! 🚀</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Award className="text-purple-600" />
          Recent Heroes
        </h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {recentQuests.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentQuests.map((quest, index) => {
                const catInfo = CATEGORY_INFO[quest.quests?.category as keyof typeof CATEGORY_INFO];
                return (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 * index }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {quest.profiles?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          <span className="text-purple-600">{quest.profiles?.username || 'Anonymous'}</span>
                          {' '}completed{' '}
                          <span className="font-bold">{quest.quests?.title}</span>
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{catInfo?.icon || '📋'}</span>
                          <span>+{quest.quests?.xp_reward || 0} XP</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No completed quests yet. Start your journey!</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 mt-4 text-purple-600 font-medium hover:text-purple-700"
              >
                Find Quests <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Make an Impact?</h2>
          <p className="text-purple-200 mb-8">Join our community of heroes and start making a difference today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              Find Quests Near You
            </Link>
            <Link
              href="/create-quest"
              className="px-8 py-4 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-400 transition-colors"
            >
              Create a Quest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
