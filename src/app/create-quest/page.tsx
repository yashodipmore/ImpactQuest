'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Zap,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  Camera,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toaster';
import { CATEGORY_CONFIG } from '@/lib/gamification';

const CATEGORIES = [
  { value: 'environment', label: 'Environment 🌱', icon: '🌱' },
  { value: 'elderly_care', label: 'Elderly Care 👴', icon: '👴' },
  { value: 'food_rescue', label: 'Food Rescue 🍽️', icon: '🍽️' },
  { value: 'education', label: 'Education 📚', icon: '📚' },
  { value: 'community', label: 'Community 🤝', icon: '🤝' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', xp: 25, color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'medium', label: 'Medium', xp: 50, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'hard', label: 'Hard', xp: 75, color: 'bg-red-100 text-red-700 border-red-300' },
];

export default function CreateQuestPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'environment',
    difficulty: 'easy',
    estimated_time: 15,
    address: '',
    requirements: [''],
    verification_criteria: ['Take a photo of completed task'],
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login?redirect=/create-quest');
        return;
      }
      setUser({ id: user.id });
    });

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default to Nagpur
          setUserLocation({ lat: 21.1458, lng: 79.0882 });
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleAddRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, ''],
    });
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    });
  };

  const handleRequirementChange = (index: number, value: string) => {
    const updated = [...formData.requirements];
    updated[index] = value;
    setFormData({ ...formData, requirements: updated });
  };

  const getXPReward = () => {
    const diff = DIFFICULTIES.find((d) => d.value === formData.difficulty);
    return diff?.xp || 25;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userLocation) {
      toast({ message: 'Please wait for location', type: 'error' });
      return;
    }

    if (!formData.title || !formData.description || !formData.address) {
      toast({ message: 'Please fill all required fields', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('quests').insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        xp_reward: getXPReward(),
        estimated_time: formData.estimated_time,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        address: formData.address,
        requirements: formData.requirements.filter((r) => r.trim() !== ''),
        verification_criteria: formData.verification_criteria,
        is_active: true,
        is_featured: false,
        created_by: user.id,
      } as unknown as never);

      if (error) throw error;

      setSuccess(true);
      toast({ message: '🎉 Quest created successfully!', type: 'success' });

      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error creating quest:', error);
      toast({ message: 'Failed to create quest', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md w-full shadow-2xl">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quest Created! 🎯</h1>
          <p className="text-gray-600 mb-6">
            Your quest is now live and ready for heroes to complete!
          </p>
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
            <Loader2 size={20} className="animate-spin" />
            Redirecting to map...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold">Create a Quest 🚀</h1>
          <p className="text-purple-200 mt-1">Design a challenge for your community</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Location Status */}
        <div className={`p-4 rounded-xl ${userLocation ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <div className="flex items-center gap-2">
            <MapPin size={20} className={userLocation ? 'text-green-600' : 'text-yellow-600'} />
            <span className={userLocation ? 'text-green-700' : 'text-yellow-700'}>
              {userLocation 
                ? `📍 Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` 
                : 'Getting your location...'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Quest will be created at your current location</p>
        </div>

        {/* Title */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quest Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Clean the Park, Help Elderly Cross Road"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what the hero needs to do..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {/* Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.value })}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.category === cat.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <span className="text-2xl block mb-1">{cat.icon}</span>
                <span className="text-sm font-medium">{cat.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Difficulty & XP Reward
          </label>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.value}
                type="button"
                onClick={() => setFormData({ ...formData, difficulty: diff.value })}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.difficulty === diff.value
                    ? `${diff.color} border-current`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium block">{diff.label}</span>
                <span className="text-sm flex items-center justify-center gap-1 mt-1">
                  <Zap size={14} /> {diff.xp} XP
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Time & Address */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock size={16} className="inline mr-1" />
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={formData.estimated_time}
              onChange={(e) => setFormData({ ...formData, estimated_time: parseInt(e.target.value) || 15 })}
              min={5}
              max={180}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Location Address *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., Futala Lake, Nagpur"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Requirements (What the hero needs)
          </label>
          <div className="space-y-3">
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                  placeholder="e.g., Trash bag, Water bottle"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddRequirement}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              <Plus size={20} /> Add Requirement
            </button>
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-6">
          <h3 className="font-semibold text-gray-700 mb-3">📋 Quest Preview</h3>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                {CATEGORIES.find((c) => c.value === formData.category)?.icon || '🎯'}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">
                  {formData.title || 'Your Quest Title'}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {formData.description || 'Quest description will appear here...'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span className={`px-2 py-0.5 rounded font-medium ${
                    DIFFICULTIES.find((d) => d.value === formData.difficulty)?.color
                  }`}>
                    {formData.difficulty.toUpperCase()}
                  </span>
                  <span className="text-purple-600 font-bold">+{getXPReward()} XP</span>
                  <span className="text-gray-500">{formData.estimated_time} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !userLocation}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Creating Quest...
            </>
          ) : (
            <>
              <Plus size={24} />
              Create Quest
            </>
          )}
        </button>
      </form>
    </div>
  );
}
