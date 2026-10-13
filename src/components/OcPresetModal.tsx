import React, { useState } from 'react';
import { OcPresetType } from '../types/miner';
import { playClickSound, playFanRampSound } from '../utils/sound';

interface OcPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (params: {
    preset: OcPresetType;
    powerLimit: number;
    coreOffset: number;
    memOffset: number;
    targetGpus: number[];
  }) => void;
  initialPreset?: OcPresetType;
}

export const OcPresetModal: React.FC<OcPresetModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
  initialPreset = 'balanced',
}) => {
  const [selectedPreset, setSelectedPreset] = useState<OcPresetType>(initialPreset);
  const [powerLimit, setPowerLimit] = useState(80);
  const [coreOffset, setCoreOffset] = useState(150);
  const [memOffset, setMemOffset] = useState(1000);
  const [targetGpus, setTargetGpus] = useState<number[]>([0, 1, 2, 3]);
  const [thermalSafeguard, setThermalSafeguard] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: OcPresetType) => {
    playClickSound();
    setSelectedPreset(preset);
    if (preset === 'eco') {
      setPowerLimit(65);
      setCoreOffset(-50);
      setMemOffset(800);
    } else if (preset === 'max-hash') {
      setPowerLimit(105);
      setCoreOffset(220);
      setMemOffset(1400);
    } else {
      setPowerLimit(80);
      setCoreOffset(150);
      setMemOffset(1000);
    }
  };

  const handleToggleGpu = (gpuId: number) => {
    playClickSound();
    if (targetGpus.includes(gpuId)) {
      setTargetGpus(targetGpus.filter((id) => id !== gpuId));
    } else {
      setTargetGpus([...targetGpus, gpuId]);
    }
  };

  const handleToggleAllGpus = () => {
    playClickSound();
    if (targetGpus.length === 4) {
      setTargetGpus([]);
    } else {
      setTargetGpus([0, 1, 2, 3]);
    }
  };

  const handleFlash = () => {
    playFanRampSound();
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
      onApplyPreset({
        preset: selectedPreset,
        powerLimit,
        coreOffset,
        memOffset,
        targetGpus,
      });
      onClose();
    }, 700);
  };

  // Projection values based on preset
  const projections = {
    eco: {
      profit: '$15.10',
      profitSub: '+1.9% Net / Less Power',
      power: '890 W',
      powerSub: '$2.35 / day elec',
      thermal: '+36°C',
      monthly: '$453.00',
    },
    balanced: {
      profit: '$14.82',
      profitSub: 'Baseline Target',
      power: '1,140 W',
      powerSub: '$3.01 / day elec',
      thermal: '+27°C',
      monthly: '$444.60',
    },
    'max-hash': {
      profit: '$16.40',
      profitSub: '+10.6% Net Hash Output',
      power: '1,320 W',
      powerSub: '$3.48 / day elec',
      thermal: '+17°C',
      monthly: '$492.00',
    },
  }[selectedPreset];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e]/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#141924] border border-[#00f0ff]/30 rounded-xl shadow-2xl p-6 flex flex-col gap-5 my-auto max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2533]">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />
            <div>
              <span className="text-[10px] text-[#00f0ff] uppercase font-mono tracking-wider">
                // HARDWARE CLOCK CALIBRATION
              </span>
              <h3 className="text-lg md:text-xl text-[#e1e2ec] font-bold font-display tracking-tight">
                RIG_ALPHA // OVERCLOCK PRESET ARCHITECTURE
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#101520] text-[#00fe66] text-xs font-mono">
              VBIOS LOCK
            </span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded hover:bg-[#1f2838] text-[#849495] hover:text-white transition-all"
            title="Close Modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Preset Cards Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[#849495] uppercase font-mono tracking-wider">
            SELECT ARCHITECTURAL PROFILE PRESET
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* ECO */}
            <div
              onClick={() => handleSelectPreset('eco')}
              className={`cursor-pointer p-4 rounded-lg transition-all flex flex-col justify-between gap-3 ${
                selectedPreset === 'eco'
                  ? 'bg-[#1b2533] border-2 border-[#00fe66] shadow-[0_0_14px_rgba(0,254,102,0.25)]'
                  : 'bg-[#101520] hover:bg-[#161d2b] border border-[#1e2533]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-1.5 py-0.5 rounded bg-[#00fe66]/15 text-[#00fe66] text-xs font-bold font-mono">
                  ECO-RUN
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#00fe66]">eco</span>
              </div>
              <div>
                <h4 className="text-xl text-white font-bold font-mono">
                  171.2 <span className="text-xs font-mono text-[#849495]">MH/s</span>
                </h4>
                <p className="text-xs text-[#849495]">Max Efficiency & Thermal Margins</p>
              </div>
              <div className="flex flex-col gap-1 pt-2 border-t border-[#1e2533] text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#849495]">Power:</span>
                  <span className="text-[#00fe66] font-bold">890 W (-250W)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#849495]">Die Temp:</span>
                  <span className="text-white font-bold">49°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#849495]">Efficiency:</span>
                  <span className="text-[#00fe66] font-bold">0.192 MH/W (+18%)</span>
                </div>
              </div>
            </div>

            {/* BALANCED */}
            <div
              onClick={() => handleSelectPreset('balanced')}
              className={`cursor-pointer p-4 rounded-lg transition-all flex flex-col justify-between gap-3 ${
                selectedPreset === 'balanced'
                  ? 'bg-[#1b2533] border-2 border-[#00f0ff] shadow-[0_0_14px_rgba(0,240,255,0.25)]'
                  : 'bg-[#101520] hover:bg-[#161d2b] border border-[#1e2533]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-1.5 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] text-xs font-bold font-mono">
                  OPTIMAL SPEC
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#00f0ff]">verified</span>
              </div>
              <div>
                <h4 className="text-xl text-white font-bold font-mono">
                  184.6 <span className="text-xs font-mono text-[#849495]">MH/s</span>
                </h4>
                <p className="text-xs text-[#849495]">Balanced Factory Calibrated</p>
              </div>
              <div className="flex flex-col gap-1 pt-2 border-t border-[#1e2533] text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#849495]">Power:</span>
                  <span className="text-white font-bold">1,140 W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#849495]">Die Temp:</span>
                  <span className="text-white font-bold">58°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#849495]">Efficiency:</span>
                  <span className="text-[#00f0ff] font-bold">0.162 MH/W</span>
                </div>
              </div>
            </div>

            {/* MAX HASH */}
            <div
              onClick={() => handleSelectPreset('max-hash')}
              className={`cursor-pointer p-4 rounded-lg transition-all flex flex-col justify-between gap-3 ${
                selectedPreset === 'max-hash'
                  ? 'bg-[#1b2533] border-2 border-[#ffb703] shadow-[0_0_14px_rgba(255,183,3,0.25)]'
                  : 'bg-[#101520] hover:bg-[#161d2b] border border-[#1e2533]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-1.5 py-0.5 rounded bg-[#ffb703]/15 text-[#ffb703] text-xs font-bold font-mono">
                  AGGRESSIVE BOOST
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#ffb703]">bolt</span>
              </div>
              <div>
                <h4 className="text-xl text-white font-bold font-mono">
                  198.4 <span className="text-xs font-mono text-[#849495]">MH/s</span>
                </h4>
                <p className="text-xs text-[#849495]">Peak Hash Output Ceiling</p>
              </div>
              <div className="flex flex-col gap-1 pt-2 border-t border-[#1e2533] text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#849495]">Power:</span>
                  <span className="text-[#ffb703] font-bold">1,320 W (+180W)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#849495]">Die Temp:</span>
                  <span className="text-[#ffb703] font-bold">68°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#849495]">Efficiency:</span>
                  <span className="text-[#849495] font-bold">0.150 MH/W</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projected Revenue & Thermal Delta */}
        <div className="p-4 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-2">
          <span className="text-[11px] text-[#849495] uppercase font-mono tracking-wider">
            PROJECTED REVENUE & THERMAL DELTA
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded bg-[#141924] border border-[#1e2533]">
              <span className="text-[10px] text-[#849495] block font-mono">NET PROFIT (24H)</span>
              <span className="text-lg text-[#00fe66] font-mono font-bold">{projections.profit}</span>
              <span className="text-[10px] text-[#849495] block font-mono">{projections.profitSub}</span>
            </div>
            <div className="p-2.5 rounded bg-[#141924] border border-[#1e2533]">
              <span className="text-[10px] text-[#849495] block font-mono">FLEET DRAW</span>
              <span className="text-lg text-white font-mono font-bold">{projections.power}</span>
              <span className="text-[10px] text-[#849495] block font-mono">{projections.powerSub}</span>
            </div>
            <div className="p-2.5 rounded bg-[#141924] border border-[#1e2533]">
              <span className="text-[10px] text-[#849495] block font-mono">THERMAL HEADROOM</span>
              <span className="text-lg text-[#00f0ff] font-mono font-bold">{projections.thermal}</span>
              <span className="text-[10px] text-[#849495] block font-mono">Safe vs 85°C trip</span>
            </div>
            <div className="p-2.5 rounded bg-[#141924] border border-[#1e2533]">
              <span className="text-[10px] text-[#849495] block font-mono">MONTHLY RUN</span>
              <span className="text-lg text-[#00fe66] font-mono font-bold">{projections.monthly}</span>
              <span className="text-[10px] text-[#849495] block font-mono">Pool Net Projection</span>
            </div>
          </div>
        </div>

        {/* Fine Tuning Override Sliders */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#849495] uppercase font-mono tracking-wider">
              VOLTAGE & CLOCK OFFSETS OVERRIDE
            </span>
            <span className="text-xs text-[#00f0ff] font-mono">CALIBRATION CONTROLS</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Power Limit */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-[#101520] border border-[#1e2533]">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#849495]">Power Limit:</span>
                <span className="text-[#00f0ff] font-bold">{powerLimit}%</span>
              </div>
              <input
                type="range"
                min="55"
                max="115"
                value={powerLimit}
                onChange={(e) => setPowerLimit(Number(e.target.value))}
                className="w-full accent-[#00f0ff] bg-[#1a212e] h-2 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#849495] font-mono">
                <span>55% (Eco)</span>
                <span>115% (Turbo)</span>
              </div>
            </div>

            {/* Core Clock Offset */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-[#101520] border border-[#1e2533]">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#849495]">Core Offset:</span>
                <span className="text-[#00f0ff] font-bold">
                  {coreOffset >= 0 ? `+${coreOffset}` : coreOffset} MHz
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="300"
                value={coreOffset}
                onChange={(e) => setCoreOffset(Number(e.target.value))}
                className="w-full accent-[#00f0ff] bg-[#1a212e] h-2 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#849495] font-mono">
                <span>-100 MHz</span>
                <span>+300 MHz</span>
              </div>
            </div>

            {/* Memory Clock Offset */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-[#101520] border border-[#1e2533]">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#849495]">Memory Offset:</span>
                <span className="text-[#00f0ff] font-bold">+{memOffset} MHz</span>
              </div>
              <input
                type="range"
                min="0"
                max="1600"
                step="50"
                value={memOffset}
                onChange={(e) => setMemOffset(Number(e.target.value))}
                className="w-full accent-[#00f0ff] bg-[#1a212e] h-2 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#849495] font-mono">
                <span>0 MHz</span>
                <span>+1,600 MHz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Target Nodes Selection */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-[#849495] uppercase font-mono">APPLY TARGET NODES</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleAllGpus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                targetGpus.length === 4
                  ? 'bg-[#1b2533] text-[#00f0ff] border border-[#00f0ff]/40 font-bold'
                  : 'bg-[#101520] text-[#849495] border border-[#1e2533]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {targetGpus.length === 4 ? 'check_box' : 'check_box_outline_blank'}
              </span>
              <span>All Fleet Nodes (4x)</span>
            </button>

            {[0, 1, 2, 3].map((gpuId) => {
              const selected = targetGpus.includes(gpuId);
              const names = ['GPU #0 (RTX 4090)', 'GPU #1 (3080 Ti)', 'GPU #2 (RTX 3070)', 'GPU #3 (6800 XT)'];
              return (
                <button
                  key={gpuId}
                  type="button"
                  onClick={() => handleToggleGpu(gpuId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                    selected
                      ? 'bg-[#161f2c] text-[#e1e2ec] border border-[#00f0ff]/30'
                      : 'bg-[#101520] text-[#849495] border border-[#1e2533]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {selected ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  <span>{names[gpuId]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1e2533] flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#849495]">
            <input
              type="checkbox"
              checked={thermalSafeguard}
              onChange={(e) => setThermalSafeguard(e.target.checked)}
              className="accent-[#00f0ff] rounded cursor-pointer"
            />
            <span>Lock Thermal Safeguard at 78°C (Auto-TDP Throttle)</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="px-4 py-2 rounded bg-[#161d2b] hover:bg-[#1f2838] text-white text-xs font-mono transition-all"
            >
              Cancel
            </button>
            <button
              disabled={isFlashing || targetGpus.length === 0}
              onClick={handleFlash}
              className={`px-5 py-2 rounded bg-[#00f0ff] text-[#002022] text-xs font-mono font-bold flex items-center gap-2 hover:brightness-110 shadow-[0_0_16px_rgba(0,240,255,0.35)] transition-all ${
                isFlashing ? 'opacity-70 animate-pulse' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isFlashing ? 'sync' : 'flash_on'}
              </span>
              <span>{isFlashing ? 'Flashing VBIOS...' : 'Flash & Apply Clocks'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
