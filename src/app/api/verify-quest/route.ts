import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Database, SubmissionStatus } from '@/types/database';

type Quest = Database['public']['Tables']['quests']['Row'];
type SubmissionInsert = Database['public']['Tables']['quest_submissions']['Insert'];

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';

// Fast mode - skip slow AI, use location + basic checks
const FAST_MODE = true;
const AI_TIMEOUT = 5000; // 5 second timeout for AI

// Labels for different quest categories
const CATEGORY_LABELS: Record<string, string[]> = {
  environment: [
    'trash bag', 'garbage', 'litter', 'plastic waste', 'cleaning',
    'recycling', 'outdoor cleanup', 'park', 'nature', 'tree planting',
    'sapling', 'watering plants', 'environmental work'
  ],
  elderly_care: [
    'elderly person', 'senior citizen', 'old person', 'helping elderly',
    'wheelchair', 'walking assistance', 'care giving', 'companionship'
  ],
  food_rescue: [
    'food', 'meal', 'restaurant', 'food donation', 'food container',
    'cooking', 'packaged food', 'food delivery', 'kitchen'
  ],
  education: [
    'books', 'library', 'reading', 'teaching', 'tutoring', 'classroom',
    'school supplies', 'notebook', 'education', 'learning'
  ],
  community: [
    'community service', 'volunteer', 'helping', 'group activity',
    'charity', 'donation', 'social work', 'neighborhood'
  ],
};

// Calculate distance between two GPS coordinates (in meters)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Analyze image with Hugging Face CLIP (with timeout)
async function analyzeWithCLIP(
  imageBase64: string,
  candidateLabels: string[]
): Promise<{ label: string; score: number }[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey || FAST_MODE) {
    return []; // Skip in fast mode
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT);

  try {
    const response = await fetch(
      `${HUGGINGFACE_API_URL}/openai/clip-vit-large-patch14`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imageBase64,
          parameters: {
            candidate_labels: candidateLabels,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('CLIP API error:', await response.text());
      return [];
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('CLIP analysis failed or timed out:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const formData = await request.formData();
    
    const questId = formData.get('questId') as string;
    const userQuestId = formData.get('userQuestId') as string;
    const userId = formData.get('userId') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const photo = formData.get('photo') as File;

    if (!questId || !userId || !userQuestId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get quest details (single fast query)
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('id, title, category, xp_reward, is_featured, latitude, longitude')
      .eq('id', questId)
      .single<Quest>();

    if (questError || !quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    const questData = quest as Quest;

    const reasons: string[] = [];
    let confidence = 0;
    let objectMatch = false;
    let locationMatch = false;
    const detectedLabels: string[] = [];

    // 1. Check location proximity
    const distance = calculateDistance(
      latitude,
      longitude,
      questData.latitude,
      questData.longitude
    );

    const maxDistance = 200; // 200 meters
    if (distance <= maxDistance) {
      locationMatch = true;
      confidence += 40; // Increased location weight
      reasons.push(`✓ Location verified (${Math.round(distance)}m from quest)`);
    } else {
      reasons.push(`✗ Too far from quest location (${Math.round(distance)}m away)`);
    }

    // 2. Photo validation (quick check - no AI call)
    if (photo && photo.size > 10000) { // Photo exists and > 10KB
      objectMatch = true;
      confidence += 35;
      reasons.push('✓ Photo proof submitted');
    } else if (photo) {
      confidence += 15;
      reasons.push('⚠️ Photo quality low');
    }

    // 3. Optional AI Analysis (only if not in fast mode)
    if (!FAST_MODE && photo) {
      try {
        const buffer = await photo.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const imageBase64 = `data:${photo.type};base64,${base64}`;

        const categoryLabels = CATEGORY_LABELS[questData.category] || CATEGORY_LABELS.community;
        const clipResults = await analyzeWithCLIP(imageBase64, categoryLabels);

        if (clipResults && clipResults.length > 0) {
          const topResult = clipResults[0];
          
          if (topResult.score > 0.3) {
            confidence += 20;
            detectedLabels.push(topResult.label);
            reasons.push(`✓ AI Detected: ${topResult.label}`);
          }

          clipResults.slice(0, 3).forEach((r) => {
            if (!detectedLabels.includes(r.label)) {
              detectedLabels.push(r.label);
            }
          });
        }
      } catch (aiError) {
        console.error('AI analysis skipped:', aiError);
      }
    }

    // Base confidence for valid submission
    confidence += 10;

    // Normalize confidence
    confidence = Math.max(0, Math.min(100, confidence));

    // Determine if verified (60%+ for now, can be adjusted)
    const verified = confidence >= 60 && locationMatch;

    // Save submission to database
    const { error: submissionError } = await supabase
      .from('quest_submissions')
      .insert({
        user_id: userId,
        quest_id: questId,
        user_quest_id: userQuestId,
        image_url: imageUrl,
        submitted_latitude: latitude,
        submitted_longitude: longitude,
        ai_confidence: confidence,
        ai_labels: detectedLabels,
        verification_status: (verified ? 'verified' : 'rejected') as 'pending' | 'verified' | 'rejected',
        rejection_reason: verified ? null : reasons.filter(r => r.startsWith('✗')).join('; '),
        verified_at: verified ? new Date().toISOString() : null,
      } as unknown as never);

    if (submissionError) {
      console.error('Submission save error:', submissionError);
    }

    // If verified, update user quest and profile in parallel
    let xpAwarded = 0;
    if (verified) {
      xpAwarded = questData.is_featured ? questData.xp_reward * 2 : questData.xp_reward;

      // Run updates in parallel for speed
      await Promise.all([
        // Update user quest
        supabase
          .from('user_quests')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            xp_earned: xpAwarded,
          } as unknown as never)
          .eq('id', userQuestId),
        
        // Increment profile XP directly (faster than select+update)
        (async () => {
          try {
            await supabase.rpc('increment_xp', { user_id: userId, xp_amount: xpAwarded } as never);
          } catch {
            // Fallback: manual update if RPC doesn't exist
            const { data: profile } = await supabase
              .from('profiles')
              .select('total_xp, quests_completed')
              .eq('id', userId)
              .single();
            
            if (profile) {
              await supabase
                .from('profiles')
                .update({
                  total_xp: (profile as { total_xp: number }).total_xp + xpAwarded,
                  quests_completed: (profile as { quests_completed: number }).quests_completed + 1,
                } as unknown as never)
                .eq('id', userId);
            }
          }
        })()
      ]);
    }

    const responseTime = Date.now() - startTime;
    console.log(`Verification completed in ${responseTime}ms`);

    return NextResponse.json({
      verified,
      confidence,
      labels: detectedLabels,
      reasons,
      locationMatch,
      objectMatch,
      xpAwarded: verified ? xpAwarded : 0,
      responseTime,
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: String(error) },
      { status: 500 }
    );
  }
}
