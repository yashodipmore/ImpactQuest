'use client';

import { CATEGORY_CONFIG } from '@/lib/gamification';

interface FilterPanelProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (difficulty: string) => void;
}

const DIFFICULTIES = [
  { value: 'all', label: 'All Levels', color: 'bg-[#F8F5FF] text-[#6B6B8D]' },
  { value: 'easy', label: 'Easy', color: 'bg-[#26DE81]/10 text-[#26DE81]' },
  { value: 'medium', label: 'Medium', color: 'bg-[#FF9F43]/10 text-[#FF9F43]' },
  { value: 'hard', label: 'Hard', color: 'bg-[#FF6B6B]/10 text-[#FF6B6B]' },
];

export default function FilterPanel({
  selectedCategory,
  setSelectedCategory,
  selectedDifficulty,
  setSelectedDifficulty,
}: FilterPanelProps) {
  const categories = [
    { value: 'all', label: 'All Categories', icon: '🌍', color: 'bg-[#F8F5FF] text-[#6B6B8D]' },
    ...Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
      value: key,
      label: config.label,
      icon: config.icon,
      color: config.lightColor,
    })),
  ];

  return (
    <div className="mt-4 pt-4 border-t border-[#E0D6F8]">
      {/* Category Filters */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-[#1a1a2e] mb-3">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.value
                  ? 'bg-[#7C5CFF] text-white shadow-md shadow-purple-500/25'
                  : cat.color + ' hover:shadow-sm'
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Filters */}
      <div>
        <p className="text-sm font-semibold text-[#1a1a2e] mb-3">Difficulty</p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff.value}
              onClick={() => setSelectedDifficulty(diff.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedDifficulty === diff.value
                  ? 'bg-[#7C5CFF] text-white shadow-md shadow-purple-500/25'
                  : diff.color + ' hover:shadow-sm'
              }`}
            >
              {diff.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
