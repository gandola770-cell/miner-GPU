import React, { useState } from 'react';
import { GpuDevice } from '../types/miner';
import { playClickSound, playFanRampSound } from '../utils/sound';

interface ThermalPowerViewProps {
  gpus: GpuDevice[];
  onUpdateGpu: (id: number, partial: Partial<GpuDevice>) => void;
  totalPowerWatts: number;
  tariffKwh: number;
  onTriggerTestHeatSpike?: () => void;
}

export const ThermalPowerView: React.FC<ThermalPowerViewProps> = ({
  gpus,
  onUpdateGpu,
  totalPowerWatts,
  tariffKwh,
  onTriggerTestHeatSpike,
}) => {
  const [activeProfile, setActiveProfile] = useState<'silent' | 'balanced' | 'aggressive'>('balanced');
  const [autoFanEnabled, setAutoFanEnabled] = useState(true);

  // Daily & monthly power metrics
  const dailyKwh = (totalPowerWatts * 24) / 1000;
  const monthlyKwh = dailyKwh * 30;
  const monthlyCost = monthlyKwh * tariffKwh;

  const handleApplyProfile = (profile: 'silent' | 'balanced' | 'aggressive') => {
    playFanRampSound();
    setActiveProfile(profile);
    gpus.forEach((gpu) => {
      let speed = 70;
      let rpm = 2200;
      if (profile === 'silent') {
        speed = 50;
        rpm = 1500;
      } else if (profile === 'aggressive') {
        speed = 95;
        rpm = 2950;
      }
      onUpdateGpu(gpu.id, {
        fanSpeedPercent: speed,
        fanRpm: rpm,
        coreTemp: profile === 'aggressive' ? Math.max(48, gpu.coreTemp - 4) : gpu.coreTemp,
      });
    });
  };

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-[1720px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#121722] border border-[#1e2533] shadow-xl">
        <div>
          <span className="text-[10px] text-[#00f0ff] uppercase font-mono tracking-wider">
            // THERMODYNAMICS & FAN CONTROLLER
          </span>
          <h1 className="text-2xl text-white font-bold font-display tracking-tight">
            THERMAL EQUILIBRIUM & POWER INFRASTRUCTURE
          </h1>
          <p className="text-xs text-[#849495] mt-1">
            Axial fan curve calibration, thermal throttle safeguards, and fleet power draw metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onTriggerTestHeatSpike && (
            <button
              onClick={onTriggerTestHeatSpike}
              className="px-3 py-1.5 rounded bg-[#25151c] hover:bg-[#341d27] text-[#ff6b6b] border border-[#ef4444]/40 text-xs font-mono flex items-center gap-1.5 transition-all"
              title="Test >85°C heat spike toast notification"
            >
              <span className="material-symbols-outlined text-[15px]">local_fire_department</span>
              TEST 86°C ALERT
            </button>
          )}
          <span className="px-3 py-1 rounded bg-[#101520] text-[#00fe66] text-xs font-mono border border-[#00fe66]/30">
            SAFEGUARD: 85°C TRIP ACTIVE
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#141924] border border-[#1e2533] flex flex-col gap-1 text-xs font-mono shadow-lg">
          <span className="text-[10px] text-[#849495]">FLEET DIE AVERAGE</span>
          <span className="text-2xl text-[#00fe66] font-bold">
            {(gpus.reduce((acc, g) => acc + g.coreTemp, 0) / gpus.length).toFixed(1)}°C
          </span>
          <span className="text-[10px] text-[#849495]">Safe thermal margin (+26.3°C)</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141924] border border-[#1e2533] flex flex-col gap-1 text-xs font-mono shadow-lg">
          <span className="text-[10px] text-[#849495]">VRAM JUNCTION MAX</span>
          <span className="text-2xl text-[#00f0ff] font-bold">
            {Math.max(...gpus.map((g) => g.vramTemp))}°C
          </span>
          <span className="text-[10px] text-[#849495]">GDDR6X Junction Limit 105°C</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141924] border border-[#1e2533] flex flex-col gap-1 text-xs font-mono shadow-lg">
          <span className="text-[10px] text-[#849495]">24H POWER CONSUMPTION</span>
          <span className="text-2xl text-white font-bold">{dailyKwh.toFixed(1)} kWh</span>
          <span className="text-[10px] text-[#849495]">
            ${(dailyKwh * tariffKwh).toFixed(2)} USD / day
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#141924] border border-[#1e2533] flex flex-col gap-1 text-xs font-mono shadow-lg">
          <span className="text-[10px] text-[#849495]">EST. MONTHLY POWER BILL</span>
          <span className="text-2xl text-[#ffb703] font-bold">${monthlyCost.toFixed(2)}</span>
          <span className="text-[10px] text-[#849495]">{monthlyKwh.toFixed(0)} kWh @ ${tariffKwh}/kWh</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Fan Curve Editor */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] text-[#849495] uppercase font-mono">
                  AXIAL FAN CURVE CALIBRATOR
                </span>
                <h3 className="text-base text-white font-bold font-display">
                  Dynamic Duty Cycle Curve: {activeProfile.toUpperCase()}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApplyProfile('silent')}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                    activeProfile === 'silent'
                      ? 'bg-[#00fe66] text-[#002107] font-bold'
                      : 'bg-[#101520] text-[#849495] hover:text-white border border-[#1e2533]'
                  }`}
                >
                  Silent (Acoustic)
                </button>
                <button
                  onClick={() => handleApplyProfile('balanced')}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                    activeProfile === 'balanced'
                      ? 'bg-[#00f0ff] text-[#002022] font-bold'
                      : 'bg-[#101520] text-[#849495] hover:text-white border border-[#1e2533]'
                  }`}
                >
                  Balanced
                </button>
                <button
                  onClick={() => handleApplyProfile('aggressive')}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                    activeProfile === 'aggressive'
                      ? 'bg-[#ffb703] text-[#271900] font-bold'
                      : 'bg-[#101520] text-[#849495] hover:text-white border border-[#1e2533]'
                  }`}
                >
                  Turbo Cooling
                </button>
              </div>
            </div>

            {/* Fan Curve Chart */}
            <div className="relative w-full h-56 bg-[#080b11] rounded-lg p-3 flex flex-col justify-between border border-[#1e2533]">
              <div className="absolute inset-0 flex flex-col justify-between py-3 px-4 pointer-events-none opacity-20">
                <div className="border-b border-[#3b494b] w-full" />
                <div className="border-b border-[#3b494b] w-full" />
                <div className="border-b border-[#3b494b] w-full" />
                <div className="border-b border-[#3b494b] w-full" />
              </div>

              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 180">
                {/* Curve line */}
                <path
                  d={
                    activeProfile === 'silent'
                      ? 'M 20 160 Q 150 150, 260 120 T 400 90 T 480 30'
                      : activeProfile === 'aggressive'
                      ? 'M 20 130 Q 150 90, 240 60 T 380 30 T 480 20'
                      : 'M 20 150 Q 150 130, 250 90 T 380 50 T 480 25'
                  }
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="2.5"
                />
                {/* Calibration Point Nodes */}
                <circle cx="50" cy="140" r="5" fill="#00f0ff" />
                <circle cx="160" cy="115" r="5" fill="#00f0ff" />
                <circle cx="280" cy="80" r="5" fill="#00fe66" />
                <circle cx="420" cy="40" r="5" fill="#ffb703" />
              </svg>

              <div className="flex justify-between items-center text-[#849495] text-[10px] font-mono z-10 px-1">
                <span>30°C (30% Fan)</span>
                <span>50°C (50% Fan)</span>
                <span>65°C (75% Fan)</span>
                <span>80°C (100% Fan)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-1 text-[#849495]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFanEnabled}
                  onChange={(e) => {
                    playClickSound();
                    setAutoFanEnabled(e.target.checked);
                  }}
                  className="accent-[#00f0ff]"
                />
                <span>Auto-Fan Temperature Hysteresis (2°C buffer)</span>
              </label>
              <span className="text-[#00fe66]">Acoustic Profile: Low Noise</span>
            </div>
          </div>
        </div>

        {/* Right Col: Per-Card Thermal Matrix */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 flex flex-col gap-4 shadow-xl">
            <span className="text-xs text-[#849495] uppercase font-mono tracking-wider">
              FLEET THERMAL SENSOR ARRAY
            </span>

            <div className="flex flex-col gap-3">
              {gpus.map((gpu) => (
                <div
                  key={gpu.id}
                  className="p-3 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">
                      GPU #{gpu.id}: {gpu.name.split(' ')[2]} {gpu.name.split(' ')[3]}
                    </span>
                    <span
                      className={`font-bold ${
                        gpu.coreTemp < 60 ? 'text-[#00fe66]' : 'text-[#00f0ff]'
                      }`}
                    >
                      {gpu.coreTemp}°C
                    </span>
                  </div>

                  <div className="w-full bg-[#1b2333] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#00f0ff] to-[#00fe66] h-full"
                      style={{ width: `${(gpu.coreTemp / 85) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-[#849495]">
                    <span>VRAM: {gpu.vramTemp}°C</span>
                    <span>Hotspot: {gpu.hotspotTemp}°C</span>
                    <span>Fan: {gpu.fanSpeedPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
