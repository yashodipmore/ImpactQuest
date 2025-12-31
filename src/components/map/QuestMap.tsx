'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Quest } from '@/types/database';
import { CATEGORY_CONFIG, DIFFICULTY_COLORS } from '@/lib/gamification';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface QuestMapProps {
  quests: Quest[];
  userLocation: { lat: number; lng: number };
  selectedQuest: Quest | null;
  onSelectQuest: (quest: Quest | null) => void;
}

// Create custom marker icons
function createQuestIcon(difficulty: string, category: string, isFeatured: boolean) {
  const categoryConfig = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.community;
  const bgColor = difficulty === 'easy' ? '#10B981' : difficulty === 'medium' ? '#F59E0B' : '#EF4444';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="quest-marker quest-marker-${difficulty} ${isFeatured ? 'quest-marker-featured' : ''}" 
           style="background: ${bgColor};">
        ${categoryConfig.icon}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

// User location marker
function createUserIcon() {
  return L.divIcon({
    className: 'user-marker',
    html: `
      <div style="
        width: 20px; 
        height: 20px; 
        background: #3B82F6; 
        border: 3px solid white; 
        border-radius: 50%; 
        box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
        animation: pulse 2s infinite;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Component to recenter map when user location changes
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
}

export default function QuestMap({
  quests,
  userLocation,
  selectedQuest,
  onSelectQuest,
}: QuestMapProps) {
  const mapRef = useRef<L.Map>(null);

  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={13}
      className="h-full w-full rounded-2xl"
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />

      {/* User location marker */}
      <Marker
        position={[userLocation.lat, userLocation.lng]}
        icon={createUserIcon()}
      >
        <Popup>
          <div className="text-center">
            <strong>📍 You are here</strong>
          </div>
        </Popup>
      </Marker>

      {/* Quest markers */}
      {quests.map((quest) => (
        <Marker
          key={quest.id}
          position={[quest.latitude, quest.longitude]}
          icon={createQuestIcon(quest.difficulty, quest.category, quest.is_featured)}
          eventHandlers={{
            click: () => onSelectQuest(quest),
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFFICULTY_COLORS[quest.difficulty as keyof typeof DIFFICULTY_COLORS]}`}>
                  {quest.difficulty.toUpperCase()}
                </span>
                {quest.is_featured && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                    ⭐ FEATURED
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{quest.title}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{quest.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-600">+{quest.xp_reward} XP</span>
                <span className="text-sm text-gray-500">{quest.estimated_time} min</span>
              </div>
              <button
                onClick={() => onSelectQuest(quest)}
                className="w-full mt-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
