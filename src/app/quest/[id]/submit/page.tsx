'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Upload, MapPin, CheckCircle, XCircle, Loader2, Share2, Copy } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toaster';
import XPCelebration from '@/components/XPCelebration';

export default function SubmitProofPage() {
  const router = useRouter();
  const params = useParams();
  const questId = params.id as string;
  const supabase = getSupabaseClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [quest, setQuest] = useState<{ title: string; latitude: number; longitude: number } | null>(null);
  const [userQuest, setUserQuest] = useState<{ id: string } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    confidence: number;
    reasons: string[];
    xpAwarded?: number;
  } | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showXPCelebration, setShowXPCelebration] = useState(false);

  const handleShare = async (platform: string) => {
    const shareText = `🎉 I just completed "${quest?.title}" on ImpactQuest and earned ${verificationResult?.xpAwarded} XP! Join me in making a difference! #ImpactQuest #SocialGood`;
    const shareUrl = window.location.origin;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareText + ' ' + shareUrl);
        toast({ message: 'Copied to clipboard!', type: 'success' });
        break;
      case 'native':
        if (navigator.share) {
          await navigator.share({
            title: 'ImpactQuest Achievement',
            text: shareText,
            url: shareUrl
          });
        }
        break;
    }
    setShowShareMenu(false);
  };

  useEffect(() => {
    // Get user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login?redirect=/quest/' + questId + '/submit');
        return;
      }
      setUser({ id: user.id });
      fetchQuestAndUserQuest(user.id);
    });

    // Get location with real-time updates
    let watchId: number | null = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({ message: 'Please enable location for verification', type: 'error' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const fetchQuestAndUserQuest = async (userId: string) => {
    // Fetch quest
    const { data: questData } = await supabase
      .from('quests')
      .select('title, latitude, longitude')
      .eq('id', questId)
      .single();

    if (questData) setQuest(questData);

    // Fetch user quest
    const { data: userQuestData } = await supabase
      .from('user_quests')
      .select('id')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .single();

    if (userQuestData) {
      setUserQuest(userQuestData);
    } else {
      toast({ message: 'Please accept the quest first', type: 'error' });
      router.push('/quest/' + questId);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setVerificationResult(null);
    }
  };

  const handleSubmit = async () => {
    if (!photo || !user || !userQuest || !userLocation) {
      toast({ message: 'Please take a photo and enable location', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = '';
      
      // Try to upload photo to Supabase Storage
      try {
        const fileName = `${user.id}/${questId}/${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('quest-proofs')
          .upload(fileName, photo);

        if (uploadError) {
          console.warn('Storage upload failed, using data URL:', uploadError.message);
          // Convert to base64 as fallback
          const reader = new FileReader();
          imageUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(photo);
          });
        } else {
          const { data: urlData } = supabase.storage
            .from('quest-proofs')
            .getPublicUrl(uploadData.path);
          imageUrl = urlData.publicUrl;
        }
      } catch (storageError) {
        console.warn('Storage error, using data URL');
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photo);
        });
      }

      // Call verification API
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('questId', questId);
      formData.append('userQuestId', userQuest.id);
      formData.append('userId', user.id);
      formData.append('imageUrl', imageUrl);
      formData.append('latitude', userLocation.lat.toString());
      formData.append('longitude', userLocation.lng.toString());

      const response = await fetch('/api/verify-quest', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setVerificationResult(result);

      if (result.verified) {
        setShowXPCelebration(true);
        toast({ message: `🎉 Quest completed! +${result.xpAwarded} XP`, type: 'success' });
      } else {
        toast({ message: 'Verification failed. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({ message: 'Failed to submit. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* XP Celebration Animation */}
      <XPCelebration 
        xp={verificationResult?.xpAwarded || 0} 
        show={showXPCelebration} 
        onComplete={() => setShowXPCelebration(false)} 
      />

      {/* Header */}
      <div className="bg-purple-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-6">
          <Link
            href={`/quest/${questId}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Quest</span>
          </Link>
          <h1 className="text-2xl font-bold">Submit Proof</h1>
          {quest && <p className="text-purple-200 mt-1">{quest.title}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Location Status */}
        <div className={`p-4 rounded-xl mb-4 ${userLocation ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <div className="flex items-center gap-2">
            <MapPin size={20} className={userLocation ? 'text-green-600' : 'text-yellow-600'} />
            <span className={userLocation ? 'text-green-700' : 'text-yellow-700'}>
              {userLocation ? 'Location detected ✓' : 'Getting your location...'}
            </span>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">
            <Camera size={20} className="inline mr-2" />
            Take Proof Photo
          </h2>

          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Proof"
                className="w-full rounded-lg mb-4"
              />
              <button
                onClick={() => {
                  setPhoto(null);
                  setPhotoPreview(null);
                  setVerificationResult(null);
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
              >
                <XCircle size={20} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
            >
              <Camera size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Tap to take or upload a photo</p>
              <p className="text-sm text-gray-400">
                Make sure the photo clearly shows your completed task
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div
            className={`rounded-xl p-6 mb-4 ${
              verificationResult.verified
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              {verificationResult.verified ? (
                <>
                  <CheckCircle size={32} className="text-green-500" />
                  <div>
                    <h3 className="font-bold text-green-700 text-xl">Quest Completed! 🎉</h3>
                    <p className="text-green-600">
                      +{verificationResult.xpAwarded} XP earned!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={32} className="text-red-500" />
                  <div>
                    <h3 className="font-bold text-red-700">Verification Failed</h3>
                    <p className="text-red-600">Please try again</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              {verificationResult.reasons.map((reason, i) => (
                <p key={i} className="text-sm text-gray-600">
                  {reason}
                </p>
              ))}
            </div>

            {verificationResult.verified && (
              <div className="mt-6 space-y-3">
                {/* Share Button */}
                <button
                  onClick={() => typeof navigator.share === 'function' ? handleShare('native') : setShowShareMenu(!showShareMenu)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Share Achievement 🎉
                </button>

                {/* Share Menu */}
                {showShareMenu && (
                  <div className="grid grid-cols-4 gap-2 p-4 bg-white rounded-xl border">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100"
                    >
                      <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white">
                        𝕏
                      </div>
                      <span className="text-xs">Twitter</span>
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100"
                    >
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        f
                      </div>
                      <span className="text-xs">Facebook</span>
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100"
                    >
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                        💬
                      </div>
                      <span className="text-xs">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-100"
                    >
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white">
                        <Copy size={20} />
                      </div>
                      <span className="text-xs">Copy</span>
                    </button>
                  </div>
                )}

                <Link
                  href="/profile"
                  className="block w-full py-3 bg-green-600 text-white rounded-lg text-center font-medium"
                >
                  View Profile
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {!verificationResult?.verified && (
          <button
            onClick={handleSubmit}
            disabled={!photo || !userLocation || isSubmitting}
            className="w-full py-4 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>Submit for Verification</span>
              </>
            )}
          </button>
        )}

        {isSubmitting && (
          <div className="mt-4 text-center">
            <div className="verification-pulse inline-block text-4xl mb-2">🔍</div>
            <p className="text-gray-600">Our AI is analyzing your proof...</p>
            <p className="text-sm text-gray-400">This may take a few seconds</p>
          </div>
        )}
      </div>
    </div>
  );
}
