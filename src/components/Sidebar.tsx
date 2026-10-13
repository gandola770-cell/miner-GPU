import React from 'react';
import { ViewTab } from '../types/miner';
import { isSoundEnabled, playClickSound, setSoundEnabled } from '../utils/sound';

interface SidebarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  poolAddress: string;
  pingMs: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  poolAddress,
  pingMs,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [soundOn, setSoundOn] = React.useState(isSoundEnabled());

  const handleNav = (tab: ViewTab) => {
    playClickSound();
    onTabChange(tab);
    onCloseMobile();
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  const navItems: { id: ViewTab; label: string; icon: string }[] = [
    { id: 'fleet-telemetry', label: 'Fleet Telemetry', icon: 'grid_view' },
    { id: 'gpu-matrix', label: 'GPU Matrix', icon: 'memory' },
    { id: 'flight-sheet', label: 'Flight Sheet', icon: 'alt_route' },
    { id: 'overclock-tuning', label: 'OC Tuner', icon: 'speed' },
    { id: 'thermal-power', label: 'Thermal & Power', icon: 'thermostat' },
    { id: 'node-terminal', label: 'Node Shell', icon: 'terminal' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-[#080b11]/95 backdrop-blur-xl z-50 flex flex-col justify-between py-4 border-r border-[#1e2533] transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Brand header */}
          <div className="px-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00fe66] shadow-[0_0_10px_#00fe66]" />
              <span className="font-display text-lg text-[#00f0ff] tracking-tight font-bold uppercase">
                NEXUS_OS
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161d2b] text-[#849495]">
                v4.2
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-[#849495] hover:text-white p-1"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all text-left ${
                    active
                      ? 'bg-[#1b2333] text-[#00f0ff] font-bold border-l-2 border-[#00f0ff] shadow-sm'
                      : 'text-[#849495] hover:bg-[#121824] hover:text-[#e1e2ec]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-lg ${active ? 'text-[#00f0ff]' : ''}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Pool Status */}
        <div className="px-4 flex flex-col gap-3">
          <div className="p-3 rounded-lg bg-[#101520] border border-[#1b2333] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#849495] uppercase font-mono">Stratum Pool</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse" />
            </div>
            <span className="text-xs text-[#e1e2ec] font-mono truncate" title={poolAddress}>
              {poolAddress.replace('stratum+ssl://', '')}
            </span>
            <div className="flex items-center justify-between text-[10px] text-[#849495] font-mono pt-0.5">
              <span>Ping: {pingMs}ms</span>
              <span className="text-[#00fe66]">0% Drop</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 px-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#849495] font-mono">NODE_UUID:</span>
              <span className="text-[10px] font-mono text-[#00f0ff]">#482-XR9</span>
            </div>
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded transition-colors ${
                soundOn ? 'text-[#00f0ff] hover:bg-[#161d2b]' : 'text-[#849495] hover:bg-[#161d2b]'
              }`}
              title={soundOn ? 'Mute sound effects' : 'Enable sound effects'}
            >
              <span className="material-symbols-outlined text-[16px]">
                {soundOn ? 'volume_up' : 'volume_off'}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
