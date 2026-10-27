import React from 'react';
import { SkillId, UsableItemId, WeaponStanceId } from '../game/rules';

export function TitleCrestEmblem() {
  return (
    <svg
      viewBox="0 0 560 172"
      className="w-full max-w-[520px] h-auto drop-shadow-[0_10px_24px_rgba(0,0,0,0.92)]"
      role="img"
      aria-label="Eclipse Chronicle: Pixel Arena"
    >
      <defs>
        <linearGradient id="eclipseGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="48%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="umbralCore" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="60%" stopColor="#09080d" />
          <stop offset="100%" stopColor="#31102f" />
        </linearGradient>
      </defs>

      {/* Outer Solar Corona Ring & Crest Silhouette */}
      <g transform="translate(280, 40)">
        <circle r="30" fill="#09080d" stroke="#f59e0b" strokeWidth="2.5" opacity="0.95" />
        <circle r="25" fill="url(#umbralCore)" stroke="#fde68a" strokeWidth="1.4" strokeDasharray="5 3" />
        {/* Solar Rays */}
        <path
          d="M0,-39 L4,-31 L-4,-31 Z M0,39 L4,31 L-4,31 Z M-39,0 L-31,4 L-31,-4 Z M39,0 L31,4 L31,-4 Z M-27,-27 L-20,-23 L-23,-20 Z M27,-27 L23,-20 L20,-23 Z M-27,27 L-23,20 L-20,23 Z M27,27 L20,23 L23,20 Z"
          fill="#f59e0b"
        />
        {/* Crescent Eclipse Cutout */}
        <path
          d="M-8,-19 A19,19 0 1,0 16,11 A15,15 0 1,1 -8,-19 Z"
          fill="url(#eclipseGold)"
        />
        {/* Horizontal Sanctum Wing Blades */}
        <path d="M-210,0 L-46,-4 L-40,0 L-46,4 Z" fill="url(#eclipseGold)" opacity="0.85" />
        <path d="M210,0 L46,-4 L40,0 L46,4 Z" fill="url(#eclipseGold)" opacity="0.85" />
        <rect x="-135" y="-3" width="6" height="6" transform="rotate(45 -132 0)" fill="#fde68a" />
        <rect x="129" y="-3" width="6" height="6" transform="rotate(45 132 0)" fill="#fde68a" />
      </g>

      {/* Main Title Lettering inside SVG Lockup */}
      <text
        x="280"
        y="112"
        textAnchor="middle"
        fill="#09080d"
        stroke="#09080d"
        strokeWidth="8"
        fontFamily="Cinzel, Georgia, serif"
        fontWeight="800"
        fontSize="38"
        letterSpacing="5"
      >
        ECLIPSE CHRONICLE
      </text>
      <text
        x="280"
        y="112"
        textAnchor="middle"
        fill="url(#eclipseGold)"
        fontFamily="Cinzel, Georgia, serif"
        fontWeight="800"
        fontSize="38"
        letterSpacing="5"
      >
        ECLIPSE CHRONICLE
      </text>

      {/* Subtitle Plaque */}
      <path
        d="M150,128 L410,128 L424,142 L410,156 L150,156 L136,142 Z"
        fill="#13111c"
        stroke="#78350f"
        strokeWidth="1.5"
      />
      <text
        x="280"
        y="147"
        textAnchor="middle"
        fill="#fde68a"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="700"
        fontSize="13"
        letterSpacing="6"
      >
        PIXEL ARENA SANCTUARY
      </text>
    </svg>
  );
}

export function VitalityHeartPip({ state }: { state: 'full' | 'cracked' | 'empty' }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
      {/* Dark outer silhouette */}
      <path
        d="M12 21.5L3.5 13C1.5 10.8 1.5 7.2 3.8 5C6 2.8 9.3 3.2 12 6C14.7 3.2 18 2.8 20.2 5C22.5 7.2 22.5 10.8 20.5 13L12 21.5Z"
        fill="#09080d"
        stroke="#272030"
        strokeWidth="2"
      />
      {state === 'full' && (
        <>
          <path
            d="M12 19.6L4.9 12.4C3.3 10.7 3.3 7.9 5.1 6.2C6.8 4.6 9.4 5 12 7.7C14.6 5 17.2 4.6 18.9 6.2C20.7 7.9 20.7 10.7 19.1 12.4L12 19.6Z"
            fill="#e11d48"
          />
          {/* Top highlight */}
          <path d="M6.5 7.2C7.6 6.2 9.2 6.4 10.5 7.6L9.4 9C8.5 8.1 7.4 8 6.5 8.8Z" fill="#fda4af" />
        </>
      )}
      {state === 'cracked' && (
        <>
          <path
            d="M12 19.6L4.9 12.4C3.3 10.7 3.3 7.9 5.1 6.2C6.8 4.6 9.4 5 11.4 7.1L9.8 10.5L12.7 12.8L11.2 18.8Z"
            fill="#f59e0b"
          />
          <path
            d="M12.2 6.8L10.3 10.5L13.2 12.6L11.5 19.2"
            stroke="#09080d"
            strokeWidth="2"
            fill="none"
          />
        </>
      )}
      {state === 'empty' && (
        <path
          d="M12 18.6L5.7 12.2C4.4 10.8 4.4 8.3 5.8 7C7.2 5.7 9.3 6 12 8.5C14.7 6 16.8 5.7 18.2 7C19.6 8.3 19.6 10.8 18.3 12.2L12 18.6Z"
          fill="#181322"
          stroke="#3f3351"
          strokeWidth="1.2"
        />
      )}
    </svg>
  );
}

export function StanceIcon({ stance }: { stance: WeaponStanceId }) {
  if (stance === 'dawnblade') {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#09080d" />
        <path d="M18.5 4.5L19.5 5.5L9.5 15.5L7.5 13.5L17.5 3.5Z" fill="#f59e0b" />
        <path d="M18.5 4.5L13 10L11.8 8.8L17.5 3.5Z" fill="#fef3c7" />
        <path d="M6 12L12 18L10.5 19.5L4.5 13.5Z" fill="#b45309" />
        <path d="M4.5 19.5L7.5 16.5L8.8 17.8L5.8 20.8Z" fill="#fde68a" />
      </svg>
    );
  }
  if (stance === 'astral_bow') {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#09080d" />
        <path
          d="M7 4.5C14.5 6.5 17.5 9.5 19.5 17"
          stroke="#38bdf8"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <line x1="7" y1="4.5" x2="19.5" y2="17" stroke="#bae6fd" strokeWidth="1.2" />
        <path d="M6 18L17.5 6.5M17.5 6.5L13.5 6.5M17.5 6.5L17.5 10.5" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#09080d" />
      <path
        d="M6 7C10 3.5 16.5 4 19 8.5C15.5 7.5 11.5 8.5 9.5 11.5Z"
        fill="#c084fc"
        stroke="#f3e8ff"
        strokeWidth="1"
      />
      <line x1="17.5" y1="6.5" x2="6.5" y2="19.5" stroke="#a855f7" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function UtilityIcon({ kind, muted }: { kind: 'mute' | 'pause' | 'restart'; muted?: boolean }) {
  if (kind === 'mute') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
        <path d="M4 9H8L13 4V20L8 15H4V9Z" fill="currentColor" />
        {muted ? (
          <path d="M16 9L21 14M21 9L16 14" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" />
        ) : (
          <path d="M16 8.5C17.8 10.2 17.8 13.8 16 15.5M18.8 6C21.8 9.2 21.8 14.8 18.8 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
      </svg>
    );
  }
  if (kind === 'pause') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
        <rect x="6" y="5" width="4.5" height="14" rx="1" fill="currentColor" />
        <rect x="13.5" y="5" width="4.5" height="14" rx="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path
        d="M19 8A8 8 0 1 0 20 13.5"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M19 3.5V8.5H14" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SkillIcon({ skillId }: { skillId: SkillId }) {
  if (skillId === 'solar_orbit') {
    return (
      <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#09080d" stroke="#f59e0b" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="6.5" stroke="#fde68a" strokeWidth="1.2" strokeDasharray="3 2" fill="none" />
        <circle cx="12" cy="5.5" r="2.5" fill="#f59e0b" />
        <circle cx="12" cy="18.5" r="2.5" fill="#f59e0b" />
        <circle cx="12" cy="12" r="2.2" fill="#fef3c7" />
      </svg>
    );
  }
  if (skillId === 'chain_arc') {
    return (
      <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#09080d" stroke="#38bdf8" strokeWidth="1.2" />
        <path
          d="M13.5 4.5L7.5 13H12.5L10.5 19.5L17.5 10.5H12.5L13.5 4.5Z"
          fill="#38bdf8"
          stroke="#e0f2fe"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (skillId === 'blaze_trail') {
    return (
      <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#09080d" stroke="#fb7185" strokeWidth="1.2" />
        <path
          d="M12 4.5C15 8 17.5 10.5 17.5 14C17.5 17.2 15 19.5 12 19.5C9 19.5 6.5 17.2 6.5 14C6.5 11.5 8 9.2 10 7.5C10 9.5 11.2 10.5 12 10.5C12.5 8.5 12 6.5 12 4.5Z"
          fill="#f43f5e"
        />
        <circle cx="12" cy="15" r="2.5" fill="#fde047" />
      </svg>
    );
  }
  if (skillId === 'phantom_echo') {
    return (
      <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#09080d" stroke="#c084fc" strokeWidth="1.2" />
        <path d="M6 17L15 8M15 8H10.5M15 8V12.5" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
        <path d="M9 18L18 9M18 9H13.5M18 9V13.5" stroke="#f3e8ff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (skillId === 'supernova_surge') {
    return (
      <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#09080d" stroke="#fbbf24" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="5" fill="#f59e0b" />
        <path
          d="M12 3.5V6.5M12 17.5V20.5M3.5 12H6.5M17.5 12H20.5M6 6L8.2 8.2M15.8 15.8L18 18M18 6L15.8 8.2M8.2 15.8L6 18"
          stroke="#fef08a"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#09080d" stroke="#10b981" strokeWidth="1.2" />
      <path
        d="M12 4.5L18 7V12.5C18 16.2 15.4 18.9 12 20C8.6 18.9 6 16.2 6 12.5V7L12 4.5Z"
        fill="#059669"
        stroke="#a7f3d0"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function CoinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="5" fill="#b45309" />
      <rect x="8.8" y="6.5" width="2.4" height="7" rx="1" fill="#fef08a" />
    </svg>
  );
}

export function UsableItemIcon({ itemId }: { itemId: UsableItemId }) {
  if (itemId === 'crimson_elixir') {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#09080d" stroke="#f43f5e" strokeWidth="1.2" />
        <path d="M9 5H15V8L17.5 12.5C18.2 13.8 17.3 18.5 14.5 18.5H9.5C6.7 18.5 5.8 13.8 6.5 12.5L9 8V5Z" fill="#e11d48" stroke="#fda4af" strokeWidth="1.2" />
        <path d="M12 10.5V15.5M9.5 13H14.5" stroke="#fff1f2" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (itemId === 'astral_tonic') {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#09080d" stroke="#38bdf8" strokeWidth="1.2" />
        <path d="M10 4.5H14V8L17 13.5C17.8 15 16.8 19 14 19H10C7.2 19 6.2 15 7 13.5L10 8V4.5Z" fill="#0284c7" stroke="#bae6fd" strokeWidth="1.2" />
        <circle cx="12" cy="14" r="2.5" fill="#e0f2fe" />
      </svg>
    );
  }
  if (itemId === 'chrono_hourglass') {
    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#09080d" stroke="#c084fc" strokeWidth="1.2" />
        <path d="M7 5.5H17M7 18.5H17M8 5.5L12 11.5L16 5.5M8 18.5L12 12.5L16 18.5" stroke="#e9d5ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="12" cy="15.5" r="2" fill="#c084fc" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#09080d" stroke="#f59e0b" strokeWidth="1.2" />
      <circle cx="12" cy="13" r="5.5" fill="#ea580c" stroke="#fde68a" strokeWidth="1.3" />
      <path d="M12 7.5V4.5L15 3.5" stroke="#fef08a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="10.5" cy="11.5" r="1.5" fill="#fef08a" />
    </svg>
  );
}


