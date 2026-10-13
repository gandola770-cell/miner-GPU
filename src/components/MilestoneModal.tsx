import React, { useEffect } from 'react';
import { playClickSound, playMilestoneChime } from '../utils/sound';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      playMilestoneChime();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e]/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#101522] border border-[#00f0ff]/40 rounded-xl shadow-2xl p-6 flex flex-col items-center text-center gap-5 my-auto overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#00f0ff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#00fe66]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#161d2b] hover:bg-[#1f2838] text-[#849495] hover:text-white transition-all z-20 cursor-pointer"
          title="Close modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Animated 3D/Vector energy trophy orb */}
        <div className="relative w-44 h-44 flex items-center justify-center animate-bounce duration-1000">
          <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '18s' }} viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="86"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              opacity="0.6"
            />
            <circle cx="100" cy="14" r="4" fill="#00f0ff" filter="drop-shadow(0 0 6px #00f0ff)" />
            <circle cx="100" cy="186" r="3.5" fill="#00fe66" filter="drop-shadow(0 0 6px #00fe66)" />
          </svg>

          <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '24s', animationDirection: 'reverse' }} viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="#00fe66"
              strokeWidth="1.5"
              strokeDasharray="12 12 4 12"
              opacity="0.5"
            />
            <polygon points="100,30 105,38 95,38" fill="#00fe66" />
            <polygon points="100,170 105,162 95,162" fill="#00f0ff" />
          </svg>

          {/* Core badge */}
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-[#080b11] via-[#141d2c] to-[#1c273a] border-2 border-[#00f0ff] shadow-[0_0_28px_rgba(0,240,255,0.45)] flex items-center justify-center z-10">
            <div className="absolute inset-2 rounded-full border border-[#00fe66]/40" />
            <span className="material-symbols-outlined text-[52px] text-[#00f0ff] drop-shadow-[0_0_12px_#00f0ff]">
              military_tech
            </span>
          </div>

          <div className="absolute -top-1 left-1/4 w-2 h-2 rounded-full bg-[#00fe66] shadow-[0_0_8px_#00fe66] animate-ping" />
          <div className="absolute bottom-2 right-1/4 w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-ping" />
        </div>

        {/* Milestone copy */}
        <div className="flex flex-col items-center gap-1.5 z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00fe66]/10 border border-[#00fe66]/30 text-[#00fe66] text-xs font-mono tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]" />
            MILESTONE UNLOCKED: FLEET EFFICIENCY PEAK
          </div>
          <h3 className="text-2xl md:text-3xl text-[#00f0ff] tracking-tight font-bold font-display pt-1">
            RECORD EPOCH CONVERGENCE
          </h3>
          <p className="text-xs md:text-sm text-[#849495] max-w-md leading-relaxed">
            Outstanding Performance! All four compute nodes synchronized flawlessly with zero rejected shares to establish a new rig telemetry milestone.
          </p>
        </div>

        {/* Reward card */}
        <div className="w-full flex flex-col items-center gap-2.5 z-10 bg-[#080b11]/80 border border-[#1e2533] rounded-xl p-4">
          <span className="text-[10px] text-[#849495] uppercase font-mono tracking-wider">
            REWARD ACCUMULATION
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono text-[#00fe66] font-bold drop-shadow-[0_0_10px_#00fe66]">
              +12,450
            </span>
            <span className="text-lg text-[#00f0ff] font-mono font-semibold">XP</span>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-[#141924] text-[#00f0ff] border border-[#00f0ff]/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">bolt</span> 1.5x Multiplier
            </span>
            <span className="px-2.5 py-1 rounded bg-[#141924] text-[#00fe66] border border-[#00fe66]/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span> +250 Block Bounty
            </span>
            <span className="px-2.5 py-1 rounded bg-[#141924] text-[#ffb703] border border-[#ffb703]/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">token</span> 28,500 Total Rig Pts
            </span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="w-full flex flex-col gap-2 z-10 pt-1">
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-full py-3 rounded-lg bg-[#00f0ff] hover:brightness-110 text-[#002022] font-mono text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            BACK TO DASHBOARD
          </button>
          <span className="text-[10px] text-[#849495] font-mono">
            TELEMETRY LOGGED TO ARCHIVE // RIG_ALPHA-PROD-01
          </span>
        </div>
      </div>
    </div>
  );
};
