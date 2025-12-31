import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import QuestDetailClient from './QuestDetailClient';
import type { Quest } from '@/types/database';

interface QuestPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuestPage({ params }: QuestPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: quest, error } = await supabase
    .from('quests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !quest) {
    notFound();
  }

  return <QuestDetailClient quest={quest as unknown as Quest} />;
}

export async function generateMetadata({ params }: QuestPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: quest } = await supabase
    .from('quests')
    .select('title, description')
    .eq('id', id)
    .single();

  if (!quest) {
    return { title: 'Quest Not Found' };
  }

  const questData = quest as unknown as { title: string; description: string };
  return {
    title: `${questData.title} | ImpactQuest`,
    description: questData.description,
  };
}
