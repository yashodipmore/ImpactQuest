export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type QuestCategory = 'environment' | 'elderly_care' | 'food_rescue' | 'education' | 'community';
export type QuestDifficulty = 'easy' | 'medium' | 'hard';
export type QuestStatus = 'active' | 'completed' | 'expired';
export type SubmissionStatus = 'pending' | 'verified' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          total_xp: number;
          level: number;
          quests_completed: number;
          current_streak: number;
          longest_streak: number;
          badges: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          total_xp?: number;
          level?: number;
          quests_completed?: number;
          current_streak?: number;
          longest_streak?: number;
          badges?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          total_xp?: number;
          level?: number;
          quests_completed?: number;
          current_streak?: number;
          longest_streak?: number;
          badges?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      quests: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: QuestCategory;
          difficulty: QuestDifficulty;
          xp_reward: number;
          estimated_time: number; // in minutes
          latitude: number;
          longitude: number;
          address: string;
          requirements: string[];
          verification_criteria: string[];
          image_url: string | null;
          is_active: boolean;
          is_featured: boolean;
          times_completed: number;
          created_by: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: QuestCategory;
          difficulty: QuestDifficulty;
          xp_reward: number;
          estimated_time: number;
          latitude: number;
          longitude: number;
          address: string;
          requirements?: string[];
          verification_criteria?: string[];
          image_url?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          times_completed?: number;
          created_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: QuestCategory;
          difficulty?: QuestDifficulty;
          xp_reward?: number;
          estimated_time?: number;
          latitude?: number;
          longitude?: number;
          address?: string;
          requirements?: string[];
          verification_criteria?: string[];
          image_url?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          times_completed?: number;
          created_by?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      user_quests: {
        Row: {
          id: string;
          user_id: string;
          quest_id: string;
          status: 'accepted' | 'in_progress' | 'submitted' | 'completed' | 'failed';
          accepted_at: string;
          started_at: string | null;
          completed_at: string | null;
          xp_earned: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          quest_id: string;
          status?: 'accepted' | 'in_progress' | 'submitted' | 'completed' | 'failed';
          accepted_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          xp_earned?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          quest_id?: string;
          status?: 'accepted' | 'in_progress' | 'submitted' | 'completed' | 'failed';
          accepted_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          xp_earned?: number;
        };
      };
      quest_submissions: {
        Row: {
          id: string;
          user_id: string;
          quest_id: string;
          user_quest_id: string;
          image_url: string;
          image_hash: string | null;
          submitted_latitude: number;
          submitted_longitude: number;
          ai_confidence: number;
          ai_labels: string[];
          verification_status: SubmissionStatus;
          rejection_reason: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quest_id: string;
          user_quest_id: string;
          image_url: string;
          image_hash?: string | null;
          submitted_latitude: number;
          submitted_longitude: number;
          ai_confidence?: number;
          ai_labels?: string[];
          verification_status?: SubmissionStatus;
          rejection_reason?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quest_id?: string;
          user_quest_id?: string;
          image_url?: string;
          image_hash?: string | null;
          submitted_latitude?: number;
          submitted_longitude?: number;
          ai_confidence?: number;
          ai_labels?: string[];
          verification_status?: SubmissionStatus;
          rejection_reason?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          category: string;
          requirement_type: 'quests_completed' | 'xp_earned' | 'streak' | 'category_specific';
          requirement_value: number;
          requirement_category: QuestCategory | null;
          rarity: 'common' | 'rare' | 'epic' | 'legendary';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon: string;
          category: string;
          requirement_type: 'quests_completed' | 'xp_earned' | 'streak' | 'category_specific';
          requirement_value: number;
          requirement_category?: QuestCategory | null;
          rarity?: 'common' | 'rare' | 'epic' | 'legendary';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          category?: string;
          requirement_type?: 'quests_completed' | 'xp_earned' | 'streak' | 'category_specific';
          requirement_value?: number;
          requirement_category?: QuestCategory | null;
          rarity?: 'common' | 'rare' | 'epic' | 'legendary';
          created_at?: string;
        };
      };
      community_stats: {
        Row: {
          id: string;
          total_quests_completed: number;
          total_trash_collected_kg: number;
          total_trees_planted: number;
          total_elderly_helped: number;
          total_meals_rescued: number;
          total_hours_volunteered: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          total_quests_completed?: number;
          total_trash_collected_kg?: number;
          total_trees_planted?: number;
          total_elderly_helped?: number;
          total_meals_rescued?: number;
          total_hours_volunteered?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          total_quests_completed?: number;
          total_trash_collected_kg?: number;
          total_trees_planted?: number;
          total_elderly_helped?: number;
          total_meals_rescued?: number;
          total_hours_volunteered?: number;
          updated_at?: string;
        };
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_id: string;
          username: string;
          avatar_url: string | null;
          total_xp: number;
          level: number;
          quests_completed: number;
          rank: number;
        };
      };
    };
    Functions: {
      get_nearby_quests: {
        Args: {
          user_lat: number;
          user_lng: number;
          radius_km: number;
        };
        Returns: {
          id: string;
          title: string;
          category: QuestCategory;
          difficulty: QuestDifficulty;
          xp_reward: number;
          latitude: number;
          longitude: number;
          distance_km: number;
        }[];
      };
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Quest = Database['public']['Tables']['quests']['Row'];
export type UserQuest = Database['public']['Tables']['user_quests']['Row'];
export type QuestSubmission = Database['public']['Tables']['quest_submissions']['Row'];
export type Badge = Database['public']['Tables']['badges']['Row'];
export type CommunityStats = Database['public']['Tables']['community_stats']['Row'];
