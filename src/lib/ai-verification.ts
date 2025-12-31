// =====================================================
// AI VERIFICATION ENGINE - Hugging Face CLIP Integration
// =====================================================

import type { QuestCategory } from '@/types/database';

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';

// Labels for different quest categories that CLIP should detect
const CATEGORY_LABELS: Record<QuestCategory, string[]> = {
  environment: [
    'trash bag', 'garbage', 'litter', 'plastic waste', 'cleaning',
    'recycling', 'outdoor cleanup', 'park', 'nature', 'tree planting',
    'sapling', 'watering plants', 'environmental work'
  ],
  elderly_care: [
    'elderly person', 'senior citizen', 'old person', 'helping elderly',
    'wheelchair', 'walking assistance', 'care giving', 'companionship',
    'grocery shopping', 'medicine', 'healthcare'
  ],
  food_rescue: [
    'food', 'meal', 'restaurant', 'food donation', 'food container',
    'cooking', 'packaged food', 'food delivery', 'kitchen', 'feeding'
  ],
  education: [
    'books', 'library', 'reading', 'teaching', 'tutoring', 'classroom',
    'school supplies', 'notebook', 'education', 'learning', 'studying'
  ],
  community: [
    'community service', 'volunteer', 'helping', 'group activity',
    'charity', 'donation', 'social work', 'neighborhood', 'teamwork'
  ],
};

// Negative labels to detect fraud/cheating
const NEGATIVE_LABELS = [
  'screenshot', 'computer screen', 'phone screen', 'TV screen',
  'printed image', 'photo of photo', 'indoor selfie', 'fake'
];

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  labels: string[];
  reasons: string[];
  locationMatch: boolean;
  objectMatch: boolean;
}

/**
 * Analyze image using Hugging Face CLIP model
 */
async function analyzeWithCLIP(
  imageBase64: string,
  candidateLabels: string[]
): Promise<{ label: string; score: number }[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY is not configured');
  }

  const response = await fetch(
    `${HUGGINGFACE_API_URL}/openai/clip-vit-large-patch14`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: imageBase64,
        parameters: {
          candidate_labels: candidateLabels,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('CLIP API Error:', error);
    throw new Error(`CLIP API failed: ${response.status}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Calculate distance between two GPS coordinates (in meters)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Main verification function
 */
export async function verifyQuestPhoto(
  imageBase64: string,
  questCategory: QuestCategory,
  questLocation: { latitude: number; longitude: number },
  userLocation: { latitude: number; longitude: number },
  maxDistanceMeters: number = 100
): Promise<VerificationResult> {
  const reasons: string[] = [];
  let confidence = 0;
  let objectMatch = false;
  let locationMatch = false;
  const detectedLabels: string[] = [];

  try {
    // 1. Check location proximity
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      questLocation.latitude,
      questLocation.longitude
    );

    if (distance <= maxDistanceMeters) {
      locationMatch = true;
      confidence += 30;
      reasons.push(`✓ Location verified (${Math.round(distance)}m from quest)`);
    } else {
      reasons.push(`✗ Too far from quest location (${Math.round(distance)}m, max ${maxDistanceMeters}m)`);
    }

    // 2. Analyze image with CLIP
    const categoryLabels = CATEGORY_LABELS[questCategory] || CATEGORY_LABELS.community;
    const allLabels = [...categoryLabels, ...NEGATIVE_LABELS];
    
    const clipResults = await analyzeWithCLIP(imageBase64, allLabels);
    
    // Sort by score
    const sortedResults = clipResults.sort((a, b) => b.score - a.score);
    
    // Check for negative/fraud labels
    const topNegative = sortedResults.find(r => 
      NEGATIVE_LABELS.includes(r.label) && r.score > 0.5
    );
    
    if (topNegative) {
      confidence -= 30;
      reasons.push(`✗ Suspicious image detected: ${topNegative.label}`);
    }

    // Check for positive category labels
    const topPositive = sortedResults.find(r =>
      categoryLabels.includes(r.label) && r.score > 0.3
    );

    if (topPositive) {
      objectMatch = true;
      confidence += 40;
      detectedLabels.push(topPositive.label);
      reasons.push(`✓ Detected: ${topPositive.label} (${Math.round(topPositive.score * 100)}% confidence)`);
    } else {
      reasons.push(`✗ Could not detect expected objects for ${questCategory} quest`);
    }

    // Add top 3 detected labels
    sortedResults.slice(0, 3).forEach(r => {
      if (!detectedLabels.includes(r.label)) {
        detectedLabels.push(r.label);
      }
    });

    // 3. Bonus points for high confidence
    if (topPositive && topPositive.score > 0.7) {
      confidence += 15;
      reasons.push('✓ High confidence match');
    }

    // 4. Add base confidence for valid submission
    confidence += 15;

    // Normalize confidence to 0-100
    confidence = Math.max(0, Math.min(100, confidence));

    // Determine if verified (70%+ confidence)
    const verified = confidence >= 70 && locationMatch;

    return {
      verified,
      confidence,
      labels: detectedLabels,
      reasons,
      locationMatch,
      objectMatch,
    };

  } catch (error) {
    console.error('Verification error:', error);
    
    // Fallback: if AI fails, use location-only verification with lower confidence
    if (locationMatch) {
      return {
        verified: true,
        confidence: 60,
        labels: [],
        reasons: [
          '⚠️ AI verification unavailable',
          '✓ Location verified - submission accepted with reduced confidence'
        ],
        locationMatch: true,
        objectMatch: false,
      };
    }

    return {
      verified: false,
      confidence: 0,
      labels: [],
      reasons: ['✗ Verification failed - please try again'],
      locationMatch: false,
      objectMatch: false,
    };
  }
}

/**
 * Generate a simple perceptual hash for duplicate detection
 * This is a simplified version - in production, use a proper library
 */
export async function generateImageHash(imageBuffer: Buffer): Promise<string> {
  // Simple hash based on image size and first bytes
  const sizeHash = imageBuffer.length.toString(16);
  const contentHash = imageBuffer.slice(0, 100).toString('hex').slice(0, 32);
  return `${sizeHash}-${contentHash}`;
}

/**
 * Convert file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = file.type || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}
