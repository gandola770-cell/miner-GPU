import React, { useState } from 'react';
import { GpuDevice } from '../types/miner';
import { playClickSound, playFanRampSound, playShareSound } from '../utils/sound';

interface OcTunerViewProps {
  gpus: GpuDevice[];
  onUpdateGpu: (id: number, partial: Partial<GpuDevice>) => void;
  onOpenOcModal: (preset?: 'eco' | 'balanced' | 'max-hash') => void;
}

export const OcTunerView: React.FC<OcTunerViewProps> = ({
  gpus,
  onUpdateGpu,
  onOpenOcModal,
}) => {
  const [selectedGpuId, setSelectedGpuId] = useState(0);
  const [memoryTiming, setMemoryTiming] = useState('timing-1');
  const [tempTarget, setTempTarget] = useState(68);
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const selectedGpu = gpus.find((g) => g.id === selectedGpuId) || gpus[0];

  const handleTestStability = () => {
    playFanRampSound();
    setTestRunning(true);
    setTestResult(null);
    setTimeout(() => {
      setTestRunning(false);
      playShareSound();
      setTestResult('STABILITY VERIFIED: 0 Memory checksum errors detected over 1,024 CUDA threads.');
    }, 2000);
  };

  const applyQuickPreset = (type: 'undervolt' | 'balanced' | 'extreme') => {
    playClickSound();
    if (type === 'undervolt') {
      onUpdateGpu(selectedGpu.id, {
        powerLimitPercent: 62,
        coreOffsetMhz: -80,
        memOffsetMhz: 900,
        voltageV: 0.85,
      });
    } else if (type === 'extreme') {
      onUpdateGpu(selectedGpu.id, {
        powerLimitPercent: 110,
        coreOffsetMhz: 240,
        memOffsetMhz: 1450,
        voltageV: 1.05,
      });
    } else {
      onUpdateGpu(selectedGpu.id, {
        powerLimitPercent: 75,
        coreOffsetMhz: 120,
        memOffsetMhz: 1100,
        voltageV: 0.95,
      });
    }
  };

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-[1720px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#121722] border border-[#1e2533] shadow-xl">
        <div>
          <span className="text-[10px] text-[#00f0ff] uppercase font-mono tracking-wider">
            // SILICON CALIBRATION ENGINE
          </span>
          <h1 className="text-2xl text-white font-bold font-display tracking-tight">
            V/F CURVE & OVERCLOCK TUNING
          </h1>
          <p className="text-xs text-[#849495] mt-1">
            Tune voltage/frequency curves, memory controller timings, and thermal throttle trip points.
          </p>
        </div>
        <button
          onClick={() => onOpenOcModal('balanced')}
          className="px-4 py-2 rounded bg-[#00f0ff] text-[#002022] font-mono font-bold text-xs flex items-center gap-2 hover:brightness-110 shadow-[0_0_14px_rgba(0,240,255,0.3)] transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">flash_on</span>
          QUICK FLASH PRESETS
        </button>
      </div>

      {/* GPU Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {gpus.map((gpu) => (
          <button
            key={gpu.id}
            onClick={() => {
              playClickSound();
              setSelectedGpuId(gpu.id);
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 shrink-0 ${
              gpu.id === selectedGpuId
                ? 'bg-[#1b2538] text-[#00f0ff] border border-[#00f0ff]/40 font-bold shadow-md'
                : 'bg-[#141924] text-[#849495] hover:text-white border border-[#1e2533]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#00fe66]" />
            <span>GPU #{gpu.id}: {gpu.name.split(' ')[2]}</span>
            <span className="text-[10px] text-[#849495]">({gpu.powerLimitPercent}%)</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Frequency / Voltage Curve Plot */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#849495] uppercase font-mono">
                  VOLTAGE / FREQUENCY COUPLING CURVE
                </span>
                <h3 className="text-base text-white font-bold font-display">
                  Dynamic Core Offset: {selectedGpu.coreOffsetMhz >= 0 ? `+${selectedGpu.coreOffsetMhz}` : selectedGpu.coreOffsetMhz} MHz @ {selectedGpu.voltageV}V
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <button
                  onClick={() => applyQuickPreset('undervolt')}
                  className="px-2.5 py-1 rounded bg-[#101520] hover:bg-[#1b2538] text-[#00fe66] border border-[#00fe66]/30 text-[10px]"
                >
                  Undervolt
                </button>
                <button
                  onClick={() => applyQuickPreset('balanced')}
                  className="px-2.5 py-1 rounded bg-[#101520] hover:bg-[#1b2538] text-[#00f0ff] border border-[#00f0ff]/30 text-[10px]"
                >
                  Balanced
                </button>
                <button
                  onClick={() => applyQuickPreset('extreme')}
                  className="px-2.5 py-1 rounded bg-[#101520] hover:bg-[#1b2538] text-[#ffb703] border border-[#ffb703]/30 text-[10px]"
                >
                  Extreme
                </button>
              </div>
            </div>

            {/* Interactive V/F SVG Graph */}
            <div className="relative w-full h-56 bg-[#080b11] rounded-lg p-3 flex flex-col justify-between border border-[#1e2533]">
              <div className="absolute inset-0 flex flex-col justify-between py-3 px-4 pointer-events-none opacity-20">
                <div className="border-b border-[#3b494b] w-full" />
                <div className="border-b border-[#3b494b] w-full" />
                <div className="border-b border-[#3b494b] w-full" />
                <div className="border-b border-[#3b494b] w-full" />
              </div>

              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 180">
                {/* Stock Curve (Dashed) */}
                <path
                  d="M 20 160 Q 150 140, 250 100 T 400 60 T 480 45"
                  fill="none"
                  stroke="#849495"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                {/* Tuned Curve (Neon Cyan) */}
                <path
                  d={`M 20 155 Q 150 ${130 - selectedGpu.coreOffsetMhz * 0.1}, 250 ${90 - selectedGpu.coreOffsetMhz * 0.15} T 400 ${50 - selectedGpu.coreOffsetMhz * 0.15} T 480 ${35 - selectedGpu.coreOffsetMhz * 0.15}`}
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="2.5"
                />
                {/* Active operating point node */}
                <circle cx="340" cy="70" r="6" fill="#00fe66" className="animate-pulse" />
              </svg>

              <div className="flex justify-between items-center text-[#849495] text-[10px] font-mono z-10 px-1">
                <span>0.750V (Idle)</span>
                <span>0.875V (Low Load)</span>
                <span>0.950V (Sweet Spot)</span>
                <span>1.050V (Max Safe)</span>
              </div>
            </div>
          </div>

          {/* Tuner Sliders */}
          <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 flex flex-col gap-4 shadow-xl">
            <span className="text-xs text-[#849495] uppercase font-mono tracking-wider">
              HARDWARE CLOCK OFFSETS (GPU #{selectedGpu.id})
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Power Limit */}
              <div className="p-3.5 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#849495]">Power Limit %:</span>
                  <span className="text-[#00f0ff] font-bold">{selectedGpu.powerLimitPercent}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="120"
                  value={selectedGpu.powerLimitPercent}
                  onChange={(e) =>
                    onUpdateGpu(selectedGpu.id, { powerLimitPercent: Number(e.target.value) })
                  }
                  className="w-full accent-[#00f0ff] bg-[#1a212e] h-2 rounded cursor-pointer"
                />
                <span className="text-[10px] text-[#849495] font-mono">
                  Max draw cap: {Math.round((selectedGpu.powerLimitPercent / 100) * selectedGpu.tdpWatts)}W
                </span>
              </div>

              {/* Core Clock Offset */}
              <div className="p-3.5 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#849495]">Core Clock Offset:</span>
                  <span className="text-[#00f0ff] font-bold">
                    {selectedGpu.coreOffsetMhz >= 0 ? `+${selectedGpu.coreOffsetMhz}` : selectedGpu.coreOffsetMhz} MHz
                  </span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="350"
                  value={selectedGpu.coreOffsetMhz}
                  onChange={(e) =>
                    onUpdateGpu(selectedGpu.id, { coreOffsetMhz: Number(e.target.value) })
                  }
                  className="w-full accent-[#00f0ff] bg-[#1a212e] h-2 rounded cursor-pointer"
                />
                <span className="text-[10px] text-[#849495] font-mono">
                  Target core clock: {selectedGpu.coreClockMhz + selectedGpu.coreOffsetMhz} MHz
                </span>
              </div>

              {/* Memory Clock Offset */}
              <div className="p-3.5 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#849495]">Memory Clock Offset:</span>
                  <span className="text-[#00fe66] font-bold">+{selectedGpu.memOffsetMhz} MHz</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1800"
                  step="50"
                  value={selectedGpu.memOffsetMhz}
                  onChange={(e) =>
                    onUpdateGpu(selectedGpu.id, { memOffsetMhz: Number(e.target.value) })
                  }
                  className="w-full accent-[#00fe66] bg-[#1a212e] h-2 rounded cursor-pointer"
                />
                <span className="text-[10px] text-[#849495] font-mono">
                  Memory effective clock: {selectedGpu.memClockMhz + selectedGpu.memOffsetMhz} MHz
                </span>
              </div>

              {/* Thermal Target */}
              <div className="p-3.5 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#849495]">Thermal Target Trip:</span>
                  <span className="text-[#ffb703] font-bold">{tempTarget}°C</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="85"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(Number(e.target.value))}
                  className="w-full accent-[#ffb703] bg-[#1a212e] h-2 rounded cursor-pointer"
                />
                <span className="text-[10px] text-[#849495] font-mono">
                  Fans will automatically ramp to 100% if die exceeds target.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Memory Timings & Verification */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 flex flex-col gap-4 shadow-xl">
            <span className="text-xs text-[#849495] uppercase font-mono tracking-wider">
              MEMORY CONTROLLER STRAPS
            </span>

            <div className="flex flex-col gap-2 text-xs font-mono">
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${
                  memoryTiming === 'timing-1'
                    ? 'bg-[#1b2538] border-[#00f0ff] text-white'
                    : 'bg-[#0e131d] border-[#1e2533] text-[#849495]'
                }`}
                onClick={() => setMemoryTiming('timing-1')}
              >
                <div>
                  <div className="font-bold">Fast Timings (Level 1)</div>
                  <div className="text-[10px] text-[#849495]">Optimized for GDDR6X Micron</div>
                </div>
                <span className="material-symbols-outlined text-sm">
                  {memoryTiming === 'timing-1' ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${
                  memoryTiming === 'timing-2'
                    ? 'bg-[#1b2538] border-[#00f0ff] text-white'
                    : 'bg-[#0e131d] border-[#1e2533] text-[#849495]'
                }`}
                onClick={() => setMemoryTiming('timing-2')}
              >
                <div>
                  <div className="font-bold">Ultra-Tight Timings (Level 2)</div>
                  <div className="text-[10px] text-[#849495]">Lowest latency, +2% hashrate</div>
                </div>
                <span className="material-symbols-outlined text-sm">
                  {memoryTiming === 'timing-2' ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${
                  memoryTiming === 'default'
                    ? 'bg-[#1b2538] border-[#00f0ff] text-white'
                    : 'bg-[#0e131d] border-[#1e2533] text-[#849495]'
                }`}
                onClick={() => setMemoryTiming('default')}
              >
                <div>
                  <div className="font-bold">Default Factory JEDEC</div>
                  <div className="text-[10px] text-[#849495]">Conservative baseline</div>
                </div>
                <span className="material-symbols-outlined text-sm">
                  {memoryTiming === 'default' ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </label>
            </div>

            {/* Test stability button */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                disabled={testRunning}
                onClick={handleTestStability}
                className={`w-full py-3 rounded-lg bg-[#1b2333] hover:bg-[#253045] border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                  testRunning ? 'animate-pulse opacity-75' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {testRunning ? 'sync' : 'rule'}
                </span>
                <span>{testRunning ? 'Verifying CUDA Memory Blocks...' : 'Run Stability Check'}</span>
              </button>

              {testResult && (
                <div className="p-3 rounded bg-[#0e131d] border border-[#00fe66]/30 text-[11px] font-mono text-[#00fe66] leading-relaxed">
                  {testResult}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
