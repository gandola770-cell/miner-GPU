import React, { useState } from 'react';
import { GpuDevice, MiningAlgorithm } from '../types/miner';
import { playClickSound, playFanRampSound } from '../utils/sound';

interface GpuMatrixViewProps {
  gpus: GpuDevice[];
  currentAlgo: MiningAlgorithm;
  onUpdateGpu: (id: number, partial: Partial<GpuDevice>) => void;
  onOpenOcModal: (preset?: 'eco' | 'balanced' | 'max-hash') => void;
}

export const GpuMatrixView: React.FC<GpuMatrixViewProps> = ({
  gpus,
  currentAlgo,
  onUpdateGpu,
  onOpenOcModal,
}) => {
  const [selectedGpuId, setSelectedGpuId] = useState<number>(0);

  const selectedGpu = gpus.find((g) => g.id === selectedGpuId) || gpus[0];

  const handleToggleState = (gpu: GpuDevice) => {
    playFanRampSound();
    onUpdateGpu(gpu.id, {
      status: gpu.status === 'mining' ? 'paused' : 'mining',
    });
  };

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-[1720px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#121722] border border-[#1e2533] shadow-xl">
        <div>
          <span className="text-[10px] text-[#00f0ff] uppercase font-mono tracking-wider">
            // HARDWARE COMPUTE BUS
          </span>
          <h1 className="text-2xl text-white font-bold font-display tracking-tight">
            GPU MATRIX ARCHITECTURE & DIE SPECS
          </h1>
          <p className="text-xs text-[#849495] mt-1">
            Real-time PCI Express bus monitoring, VBIOS revisions, and die thermal junction analysis.
          </p>
        </div>
        <button
          onClick={() => onOpenOcModal('balanced')}
          className="px-4 py-2 rounded bg-[#00f0ff] text-[#002022] font-mono font-bold text-xs flex items-center gap-2 hover:brightness-110 shadow-[0_0_14px_rgba(0,240,255,0.3)] transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          LAUNCH MATRIX TUNER
        </button>
      </div>

      {/* GPU Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {gpus.map((gpu) => {
          const isSelected = gpu.id === selectedGpuId;
          const isMining = gpu.status === 'mining';
          return (
            <div
              key={gpu.id}
              onClick={() => {
                playClickSound();
                setSelectedGpuId(gpu.id);
              }}
              className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                isSelected
                  ? 'bg-[#182030] border-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.2)]'
                  : 'bg-[#141924] border-[#1e2533] hover:border-[#2a364d]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isMining
                        ? 'bg-[#00fe66] shadow-[0_0_8px_#00fe66]'
                        : 'bg-[#ffb703]'
                    }`}
                  />
                  <span className="font-mono text-xs font-bold text-white">GPU #{gpu.id}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101520] text-[#00f0ff]">
                  {gpu.architecture.split('•')[0]}
                </span>
              </div>

              <div>
                <h3 className="text-base text-white font-bold font-display">{gpu.name}</h3>
                <span className="text-xs text-[#849495] font-mono">{gpu.vram}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-[#1e2533]">
                <div>
                  <span className="text-[10px] text-[#849495] block">HASHRATE</span>
                  <span className="text-white font-bold text-sm">
                    {isMining ? gpu.hashrate.toFixed(1) : '0.0'} {currentAlgo.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#849495] block">POWER DRAW</span>
                  <span className="text-white font-bold text-sm">{gpu.powerDrawWatts} W</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#849495] block">DIE TEMP</span>
                  <span
                    className={`font-bold ${
                      gpu.coreTemp < 65 ? 'text-[#00fe66]' : 'text-[#ffb703]'
                    }`}
                  >
                    {gpu.coreTemp}°C
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#849495] block">VRAM JUNC</span>
                  <span className="text-white font-bold">{gpu.vramTemp}°C</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-[#849495]">
                  FAN: {gpu.fanSpeedPercent}% ({gpu.fanRpm} RPM)
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleState(gpu);
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                    isMining
                      ? 'bg-[#1b2333] text-[#849495] hover:text-white'
                      : 'bg-[#00fe66] text-[#002107]'
                  }`}
                >
                  {isMining ? 'PAUSE' : 'RESUME'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Dive Hardware Spec Panel */}
      <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2533]">
          <div>
            <span className="text-[10px] text-[#00f0ff] uppercase font-mono tracking-wider">
              INSPECTION NODE: GPU #{selectedGpu.id}
            </span>
            <h2 className="text-xl text-white font-bold font-display">{selectedGpu.name}</h2>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded bg-[#101520] text-[#00fe66] border border-[#00fe66]/30">
            COMPUTE HEALTH: 100% NOMINAL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-1 text-xs font-mono">
            <span className="text-[10px] text-[#849495]">PCIE LINK STATUS</span>
            <span className="text-white font-bold">{selectedGpu.pcieSlot}</span>
            <span className="text-[10px] text-[#00fe66]">16.0 GT/s Bus Bandwidth</span>
          </div>
          <div className="p-4 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-1 text-xs font-mono">
            <span className="text-[10px] text-[#849495]">VBIOS REVISION</span>
            <span className="text-white font-bold">{selectedGpu.vbios}</span>
            <span className="text-[10px] text-[#00f0ff]">UEFI GOP Signature OK</span>
          </div>
          <div className="p-4 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-1 text-xs font-mono">
            <span className="text-[10px] text-[#849495]">SERIAL NUM / DIE</span>
            <span className="text-white font-bold">{selectedGpu.serialNumber}</span>
            <span className="text-[10px] text-[#849495]">Certified TSMC 4N Process</span>
          </div>
          <div className="p-4 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-1 text-xs font-mono">
            <span className="text-[10px] text-[#849495]">TDP LIMIT PROFILE</span>
            <span className="text-white font-bold">
              {selectedGpu.powerLimitPercent}% of {selectedGpu.tdpWatts}W
            </span>
            <span className="text-[10px] text-[#00fe66]">
              {Math.round((selectedGpu.powerLimitPercent / 100) * selectedGpu.tdpWatts)}W Cap
            </span>
          </div>
        </div>

        {/* Live tuning sliders for the selected card */}
        <div className="p-5 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-bold font-mono uppercase">
              LIVE CLOCK & VOLTAGE TUNING (GPU #{selectedGpu.id})
            </span>
            <span className="text-xs text-[#00f0ff] font-mono">Changes apply instantaneously</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#849495]">Power Limit:</span>
                <span className="text-[#00f0ff] font-bold">{selectedGpu.powerLimitPercent}%</span>
              </div>
              <input
                type="range"
                min="55"
                max="115"
                value={selectedGpu.powerLimitPercent}
                onChange={(e) =>
                  onUpdateGpu(selectedGpu.id, { powerLimitPercent: Number(e.target.value) })
                }
                className="w-full accent-[#00f0ff] bg-[#1a212e] h-2 rounded cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#849495]">Core Clock Offset:</span>
                <span className="text-[#00f0ff] font-bold">
                  {selectedGpu.coreOffsetMhz >= 0 ? `+${selectedGpu.coreOffsetMhz}` : selectedGpu.coreOffsetMhz} MHz
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="300"
                value={selectedGpu.coreOffsetMhz}
                onChange={(e) =>
                  onUpdateGpu(selectedGpu.id, { coreOffsetMhz: Number(e.target.value) })
                }
                className="w-full accent-[#00f0ff] bg-[#1a212e] h-2 rounded cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#849495]">Memory Clock Offset:</span>
                <span className="text-[#00f0ff] font-bold">+{selectedGpu.memOffsetMhz} MHz</span>
              </div>
              <input
                type="range"
                min="0"
                max="1600"
                step="50"
                value={selectedGpu.memOffsetMhz}
                onChange={(e) =>
                  onUpdateGpu(selectedGpu.id, { memOffsetMhz: Number(e.target.value) })
                }
                className="w-full accent-[#00f0ff] bg-[#1a212e] h-2 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
