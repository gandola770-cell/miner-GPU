import React, { useEffect, useState } from 'react';
import { MiningAlgorithm, ThermalAlert } from '../types/miner';
import { playClickSound, playThermalAlertSound } from '../utils/sound';

interface HeaderProps {
  isMining: boolean;
  onToggleMining: () => void;
  onReboot: () => void;
  currentAlgo: MiningAlgorithm;
  totalHashrate: number;
  estRevenueDaily: number;
  activeProfile: string;
  onSelectProfile: (profile: string) => void;
  onOpenMilestone: () => void;
  onOpenMobileSidebar: () => void;
  notificationsCount: number;
  thermalAlert: ThermalAlert | null;
  onDismissThermalAlert: () => void;
  onEmergencyCool: (gpuId?: number) => void;
  onTriggerTestHeatSpike: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isMining,
  onToggleMining,
  onReboot,
  currentAlgo,
  totalHashrate,
  estRevenueDaily,
  activeProfile,
  onSelectProfile,
  onOpenMilestone,
  onOpenMobileSidebar,
  notificationsCount,
  thermalAlert,
  onDismissThermalAlert,
  onEmergencyCool,
  onTriggerTestHeatSpike,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Play thermal alert sound whenever a new thermal alert arrives
  useEffect(() => {
    if (thermalAlert) {
      playThermalAlertSound();
    }
  }, [thermalAlert]);

  const hasCriticalAlert = Boolean(thermalAlert);

  return (
    <>
      <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-[#080b11]/90 backdrop-blur-xl z-40 border-b border-[#1e2533] shadow-md">
        <div className="h-16 w-full px-4 lg:px-6 flex items-center justify-between gap-3">
          {/* Left: Mobile hamburger + Rig Title & Live Telemetry Tickers */}
          <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-1.5 rounded bg-[#161d2b] text-[#849495] hover:text-white"
              title="Open navigation menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            {/* Rig state badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#141924] border border-[#1e2533] shrink-0">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasCriticalAlert
                    ? 'bg-[#ef4444] animate-ping shadow-[0_0_8px_#ef4444]'
                    : isMining
                    ? 'bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]'
                    : 'bg-[#ffb703]'
                }`}
              />
              <span className="text-xs font-mono font-bold text-white">NEXUS-RIG-04</span>
              <span
                className={`text-[10px] font-mono ${
                  hasCriticalAlert
                    ? 'text-[#ef4444] font-bold'
                    : isMining
                    ? 'text-[#00fe66]'
                    : 'text-[#ffb703]'
                }`}
              >
                {hasCriticalAlert ? '[THROTTLE LIMIT]' : isMining ? '[ONLINE]' : '[PAUSED]'}
              </span>
            </div>

            {/* Hashrate ticker */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded bg-[#141924] border border-[#1e2533] shrink-0 font-mono text-xs">
              <span className="text-[10px] text-[#849495]">HASHRATE:</span>
              <span className="text-[#00f0ff] font-bold">
                {isMining ? totalHashrate.toFixed(1) : '0.0'} {currentAlgo.unit}
              </span>
              <span className="text-[#849495] text-[10px]">/</span>
              <span className="text-[#7df4ff]">4.2 kH/s</span>
              <span className="text-[10px] text-[#849495]">RandomX</span>
            </div>

            {/* Algorithm Badge */}
            <div className="hidden xl:flex items-center gap-1 shrink-0 font-mono text-xs">
              <span className="text-[10px] text-[#849495] uppercase">ALGO:</span>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded bg-[#1f2838] text-[#00f0ff] text-[10px] font-bold">
                  {currentAlgo.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#141924] text-[#849495] text-[10px]">
                  RandomX
                </span>
              </div>
            </div>

            {/* 24h revenue badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded bg-[#141924] border border-[#1e2533] shrink-0 font-mono text-xs">
              <span className="text-[10px] text-[#849495] uppercase">24H REV:</span>
              <span className="text-[#00fe66] font-bold">
                ${(isMining ? estRevenueDaily : 0).toFixed(2)}/day
              </span>
            </div>
          </div>

          {/* Right: Quick Actions, Profile Selector, Notifications, Profile */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            {/* Quick Test Alert Button */}
            <button
              onClick={onTriggerTestHeatSpike}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#20151a] hover:bg-[#2d1b24] text-[#ff6b6b] border border-[#ef4444]/40 text-xs font-mono transition-all"
              title="Simulate heat spike to test >85°C toast notification"
            >
              <span className="material-symbols-outlined text-[15px]">local_fire_department</span>
              <span>TEST 86°C SPIKE</span>
            </button>

            {/* Pause / Resume button */}
            <button
              onClick={() => {
                playClickSound();
                onToggleMining();
              }}
              className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 text-xs font-mono font-semibold ${
                isMining
                  ? 'bg-[#1a212e] text-[#849495] hover:text-white hover:bg-[#232b3b]'
                  : 'bg-[#00fe66] text-[#002107] shadow-[0_0_12px_rgba(0,254,102,0.4)]'
              }`}
              title={isMining ? 'Pause mining threads' : 'Resume mining threads'}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isMining ? 'pause_circle' : 'play_circle'}
              </span>
              <span className="hidden sm:inline">{isMining ? 'PAUSE' : 'RESUME'}</span>
            </button>

            {/* Reboot Rig */}
            <button
              onClick={() => {
                playClickSound();
                onReboot();
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded bg-[#1a212e] text-[#ff6b6b] hover:bg-[#ff4d4d]/20 transition-all flex items-center gap-1.5 text-xs font-mono font-semibold"
              title="Reboot Rig Mining Daemon"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span className="hidden md:inline">REBOOT</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  playClickSound();
                  setProfileDropdownOpen(!profileDropdownOpen);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded bg-[#141924] border border-[#1e2533] hover:border-[#00f0ff]/40 text-xs font-mono text-[#e1e2ec] transition-all"
              >
                <span className="text-[#00f0ff] hidden sm:inline">PROFILE:</span>
                <span className="font-bold">{activeProfile}</span>
                <span className="material-symbols-outlined text-[16px] text-[#849495]">
                  expand_more
                </span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-[#101520] border border-[#1e2533] shadow-2xl py-1 z-50">
                  <button
                    onClick={() => {
                      onSelectProfile('PROD_MAX_EFF');
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#1a212e] flex items-center justify-between ${
                      activeProfile === 'PROD_MAX_EFF' ? 'text-[#00fe66] font-bold' : 'text-[#e1e2ec]'
                    }`}
                  >
                    <span>PROD_MAX_EFF (Eco)</span>
                    {activeProfile === 'PROD_MAX_EFF' && <span className="material-symbols-outlined text-sm">check</span>}
                  </button>
                  <button
                    onClick={() => {
                      onSelectProfile('PROD_BALANCED');
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#1a212e] flex items-center justify-between ${
                      activeProfile === 'PROD_BALANCED' ? 'text-[#00f0ff] font-bold' : 'text-[#e1e2ec]'
                    }`}
                  >
                    <span>PROD_BALANCED</span>
                    {activeProfile === 'PROD_BALANCED' && <span className="material-symbols-outlined text-sm">check</span>}
                  </button>
                  <button
                    onClick={() => {
                      onSelectProfile('PROD_MAX_HASH');
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#1a212e] flex items-center justify-between ${
                      activeProfile === 'PROD_MAX_HASH' ? 'text-[#ffb703] font-bold' : 'text-[#e1e2ec]'
                    }`}
                  >
                    <span>PROD_MAX_HASH (Peak)</span>
                    {activeProfile === 'PROD_MAX_HASH' && <span className="material-symbols-outlined text-sm">check</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Trophy Milestone button */}
            <button
              onClick={() => {
                playClickSound();
                onOpenMilestone();
              }}
              className="p-1.5 rounded bg-[#141924] border border-[#1e2533] text-[#ffb703] hover:border-[#ffb703]/50 hover:bg-[#1f2838] transition-all"
              title="Open Epoch Efficiency Milestone"
            >
              <span className="material-symbols-outlined text-[18px]">military_tech</span>
            </button>

            {/* Notification bell with Visual Thermal Alert state */}
            <div className="relative">
              <button
                onClick={() => {
                  playClickSound();
                  setNotifDropdownOpen(!notifDropdownOpen);
                }}
                className={`relative p-1.5 rounded border transition-all ${
                  hasCriticalAlert
                    ? 'bg-[#2b1016] border-[#ef4444] text-[#ef4444] animate-pulse shadow-[0_0_14px_rgba(239,68,68,0.5)]'
                    : 'bg-[#141924] border-[#1e2533] text-[#849495] hover:text-white hover:bg-[#1f2838]'
                }`}
                title={hasCriticalAlert ? 'CRITICAL THERMAL ALERT (>85°C)' : 'System Alerts & Telemetry Feed'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {hasCriticalAlert ? 'warning' : 'notifications'}
                </span>
                {hasCriticalAlert ? (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#ef4444] text-white text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-[#080b11]">
                    !
                  </span>
                ) : (
                  notificationsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00fe66] ring-2 ring-[#080b11]" />
                  )
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-lg bg-[#101520] border border-[#1e2533] shadow-2xl p-3.5 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1e2533]">
                    <span className="text-xs font-mono font-bold text-white">TELEMETRY ALERTS</span>
                    <span className={`text-[10px] font-mono ${hasCriticalAlert ? 'text-[#ef4444] font-bold' : 'text-[#00fe66]'}`}>
                      {hasCriticalAlert ? '1 CRITICAL WARNING' : 'All systems nominal'}
                    </span>
                  </div>

                  {/* Active Thermal Alert in Dropdown */}
                  {thermalAlert && (
                    <div className="my-2 p-2.5 rounded bg-[#201217] border border-[#ef4444] text-xs font-mono flex flex-col gap-1.5 shadow-md">
                      <div className="flex items-center justify-between text-[#ef4444] font-bold">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                          DIE TEMP CRITICAL ({thermalAlert.coreTemp}°C)
                        </span>
                        <span className="text-[10px] text-[#849495]">{thermalAlert.timestamp}</span>
                      </div>
                      <div className="text-[#e1e2ec] text-[11px]">
                        GPU #{thermalAlert.gpuId} ({thermalAlert.gpuName}) reached {thermalAlert.coreTemp}°C exceeding safety threshold (85°C).
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            onEmergencyCool(thermalAlert.gpuId);
                            setNotifDropdownOpen(false);
                          }}
                          className="flex-1 py-1 px-2 rounded bg-[#ef4444] hover:bg-[#dc2626] text-white text-[10px] font-bold transition-all text-center"
                        >
                          AUTO-THROTTLE & 100% FAN
                        </button>
                        <button
                          onClick={() => onDismissThermalAlert()}
                          className="py-1 px-2 rounded bg-[#1e2533] hover:bg-[#28354a] text-[#849495] hover:text-white text-[10px] transition-all"
                        >
                          DISMISS
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-1 text-xs font-mono">
                    <div className="p-2 rounded bg-[#161d2b] border border-[#232b3b]">
                      <div className="text-[10px] text-[#00f0ff]">Share Validated · GPU #0</div>
                      <div className="text-[11px] text-[#e1e2ec] mt-0.5">Difficulty 240.2G block evaluated</div>
                    </div>
                    <div className="p-2 rounded bg-[#161d2b] border border-[#232b3b]">
                      <div className="text-[10px] text-[#00fe66]">Thermal Watchdog</div>
                      <div className="text-[11px] text-[#e1e2ec] mt-0.5">Fan curves synchronized. Trip limit: 85°C</div>
                    </div>
                  </div>

                  {/* Test heat spike action inside dropdown */}
                  <div className="pt-2 border-t border-[#1e2533] mt-2">
                    <button
                      onClick={() => {
                        onTriggerTestHeatSpike();
                        setNotifDropdownOpen(false);
                      }}
                      className="w-full py-1.5 rounded bg-[#1b2333] hover:bg-[#253045] text-[#ff6b6b] hover:text-white text-[10px] font-mono flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                      Simulate Heat Spike (&gt;85°C Alert)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User badge */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00f0ff] to-[#00fe66] flex items-center justify-center text-[#002022] font-bold text-xs shadow-sm">
              <span>NX</span>
            </div>
          </div>
        </div>
      </header>

      {/* Visual Notification Toast Alert - Triggered when any GPU core temperature exceeds 85°C */}
      {thermalAlert && (
        <div className="fixed top-18 right-4 lg:right-6 z-50 max-w-lg w-[calc(100%-2rem)] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="rounded-xl bg-[#170e13]/95 backdrop-blur-xl border-2 border-[#ef4444] shadow-[0_0_30px_rgba(239,68,68,0.45)] p-4 flex flex-col gap-3">
            {/* Alert Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/40 flex items-center justify-center text-[#ef4444] shrink-0 animate-bounce">
                  <span className="material-symbols-outlined text-[22px]">local_fire_department</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-[#ef4444] text-white font-mono text-[10px] font-bold tracking-wider uppercase">
                      CRITICAL THERMAL ALERT
                    </span>
                    <span className="text-[10px] font-mono text-[#849495]">
                      {thermalAlert.timestamp}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-display mt-0.5">
                    GPU #{thermalAlert.gpuId} Die Exceeded Safety Limit ({thermalAlert.coreTemp}°C &gt; {thermalAlert.threshold}°C)
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  onDismissThermalAlert();
                }}
                className="p-1 rounded hover:bg-[#28181f] text-[#849495] hover:text-white transition-colors"
                title="Dismiss Alert"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Alert Detail & Live Progress Bar */}
            <div className="text-xs font-mono text-[#e1e2ec] leading-relaxed">
              <span>
                Compute Node <strong className="text-white">{thermalAlert.gpuName}</strong> core die reached{' '}
                <strong className="text-[#ef4444] text-sm">{thermalAlert.coreTemp}°C</strong> (VRAM Junction {thermalAlert.vramTemp}°C). Safety watchdog threshold is 85.0°C.
              </span>
            </div>

            <div className="w-full bg-[#2a131b] h-2 rounded-full overflow-hidden border border-[#ef4444]/30">
              <div
                className="bg-gradient-to-r from-[#ffb703] to-[#ef4444] h-full animate-pulse"
                style={{ width: `${Math.min(100, (thermalAlert.coreTemp / 95) * 100)}%` }}
              />
            </div>

            {/* Emergency Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <div className="text-[10px] font-mono text-[#849495]">
                Risk: Silicon throttling & dropped shares
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playClickSound();
                    onDismissThermalAlert();
                  }}
                  className="px-3 py-1.5 rounded bg-[#20151c] hover:bg-[#2c1d27] text-[#849495] hover:text-white text-xs font-mono transition-all"
                >
                  Ignore
                </button>
                <button
                  onClick={() => onEmergencyCool(thermalAlert.gpuId)}
                  className="px-3.5 py-1.5 rounded bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_16px_rgba(239,68,68,0.4)] hover:brightness-110 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">cyclone</span>
                  AUTO-THROTTLE & 100% FAN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
