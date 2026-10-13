import React, { useState } from 'react';
import { GpuDevice, MiningAlgorithm, RgbMode, TerminalLog } from '../types/miner';
import { GpuViewer3D } from './GpuViewer3D';
import { playClickSound, playFanRampSound, playShareSound } from '../utils/sound';

interface FleetTelemetryViewProps {
  gpus: GpuDevice[];
  onUpdateGpu: (id: number, partial: Partial<GpuDevice>) => void;
  currentAlgo: MiningAlgorithm;
  isMining: boolean;
  totalHashrate: number;
  totalPowerWatts: number;
  estRevenueDaily: number;
  electricityTariffKwh: number;
  logs: TerminalLog[];
  onClearLogs: () => void;
  onAddLog: (log: Omit<TerminalLog, 'id' | 'timestamp'>) => void;
  rgbMode: RgbMode;
  onRgbCycle: () => void;
  onOpenOcModal: (preset?: 'eco' | 'balanced' | 'max-hash') => void;
}

export const FleetTelemetryView: React.FC<FleetTelemetryViewProps> = ({
  gpus,
  onUpdateGpu,
  currentAlgo,
  isMining,
  totalHashrate,
  totalPowerWatts,
  estRevenueDaily,
  electricityTariffKwh,
  logs,
  onClearLogs,
  onAddLog,
  rgbMode,
  onRgbCycle,
  onOpenOcModal,
}) => {
  const [selectedGpuIndex, setSelectedGpuIndex] = useState(0);
  const [logFilter, setLogFilter] = useState<'all' | 'share' | 'thermal' | 'system'>('all');
  const [cmdInput, setCmdInput] = useState('');
  const [chartTimeframe, setChartTimeframe] = useState<'1h' | '12h' | '24h'>('24h');

  const selectedGpu = gpus[selectedGpuIndex] || gpus[0];

  // Daily electricity cost: (Watts * 24h / 1000) * $/kWh
  const dailyElecCost = ((totalPowerWatts * 24) / 1000) * electricityTariffKwh;
  const netDailyProfit = isMining ? Math.max(0, estRevenueDaily - dailyElecCost) : 0;

  // Filtered terminal logs
  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    if (logFilter === 'share') return log.type === 'share' || log.type === 'block';
    if (logFilter === 'thermal') return log.type === 'thermal';
    if (logFilter === 'system') return log.type === 'system' || log.type === 'job' || log.type === 'cpu';
    return true;
  });

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;
    const input = cmdInput.trim().toLowerCase();
    playClickSound();

    if (input === 'help') {
      onAddLog({
        type: 'system',
        tag: 'Terminal',
        message: 'Commands: status, benchmark, restart, pause, resume, temps, clr, help',
      });
    } else if (input === 'status') {
      onAddLog({
        type: 'system',
        tag: 'Status',
        message: `Fleet Hashrate: ${totalHashrate.toFixed(1)} ${currentAlgo.unit} | Power: ${totalPowerWatts}W | Nodes: ${gpus.length}/4 Active`,
      });
    } else if (input === 'clr' || input === 'clear') {
      onClearLogs();
    } else if (input === 'benchmark') {
      onAddLog({
        type: 'system',
        tag: 'Benchmark',
        message: `Starting 10-second CUDA benchmark across all 4 compute nodes...`,
      });
      setTimeout(() => {
        onAddLog({
          type: 'share',
          tag: 'Benchmark',
          message: `Benchmark complete. Fleet peak throughput: 198.2 ${currentAlgo.unit}. Error rate: 0.00%.`,
        });
      }, 1500);
    } else if (input === 'temps') {
      onAddLog({
        type: 'thermal',
        tag: 'ThermalWatchdog',
        message: `Current die temps: GPU0=${gpus[0]?.coreTemp}°C, GPU1=${gpus[1]?.coreTemp}°C, GPU2=${gpus[2]?.coreTemp}°C, GPU3=${gpus[3]?.coreTemp}°C`,
      });
    } else {
      onAddLog({
        type: 'system',
        tag: 'CLI',
        message: `Executed: ${cmdInput} — process exit code 0`,
      });
    }
    setCmdInput('');
  };

  const handleDumpLog = () => {
    playClickSound();
    const content = logs.map((l) => `[${l.timestamp}] [${l.tag}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_miner_daemon_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBenchmark = () => {
    playFanRampSound();
    onAddLog({
      type: 'system',
      tag: 'Benchmark',
      message: `Direct CUDA core benchmarking initiated on ${selectedGpu.name}...`,
    });
    // Temporary boost
    onUpdateGpu(selectedGpu.id, {
      status: 'benchmarking',
      fanSpeedPercent: 100,
      fanRpm: 3100,
    });
    setTimeout(() => {
      playShareSound();
      onUpdateGpu(selectedGpu.id, {
        status: 'mining',
        fanSpeedPercent: 78,
        fanRpm: 2450,
        sharesAccepted: selectedGpu.sharesAccepted + 3,
      });
      onAddLog({
        type: 'share',
        tag: 'Benchmark',
        message: `${selectedGpu.name} passed hardware compute integrity test. Optimal memory clock: +${selectedGpu.memOffsetMhz}MHz.`,
      });
    }, 2000);
  };

  const handleFanAggressive = () => {
    playFanRampSound();
    const newSpeed = selectedGpu.fanSpeedPercent >= 95 ? 65 : 100;
    const newRpm = newSpeed === 100 ? 3200 : 2050;
    const newTemp = newSpeed === 100 ? Math.max(48, selectedGpu.coreTemp - 5) : selectedGpu.coreTemp;
    onUpdateGpu(selectedGpu.id, {
      fanSpeedPercent: newSpeed,
      fanRpm: newRpm,
      coreTemp: newTemp,
    });
    onAddLog({
      type: 'thermal',
      tag: 'FanControl',
      message: `${selectedGpu.name} cooling profile set to ${newSpeed === 100 ? 'TURBO AGGRESSIVE (100%)' : 'BALANCED (65%)'}.`,
    });
  };

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-[1720px] mx-auto w-full">
      {/* TOP TELEMETRY HUD / SYSTEM HERO BANNER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 md:p-6 rounded-xl bg-[#121722] border border-[#1e2533] shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#00f0ff]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-24 w-72 h-72 bg-[#00fe66]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-[#1b2333] text-[#7df4ff] text-[11px] font-mono font-semibold flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00fe66] animate-pulse shadow-[0_0_8px_#00fe66]" />
              CLUSTER_ORBITAL_04
            </span>
            <span className="text-[#849495] text-[11px] font-mono tracking-wider">
              // STRATUM PROTOCOL v2.8
            </span>
            <span className="px-2 py-0.5 rounded bg-[#141924] text-[#849495] text-[11px] font-mono">
              OS: NEXUS LINUX 6.8.4-RT
            </span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap mt-1">
            <h1 className="text-2xl md:text-3xl text-white font-bold font-display tracking-tight">
              RIG_ALPHA :: TELEMETRY CONTROL
            </h1>
            <span className="text-xs text-[#00fe66] font-mono bg-[#0b0e15] px-2.5 py-1 rounded border border-[#1b2333]">
              99.98% EFFECTIVE SUBMISSION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap z-10">
          <div className="flex flex-col items-end px-3 py-1.5 rounded bg-[#161d2b] border border-[#1e2533]">
            <span className="text-[10px] text-[#849495] uppercase font-mono">
              GLOBAL RECOVERY WATCHDOG
            </span>
            <span className="text-xs text-[#00f0ff] font-mono font-bold">
              ENGAGED (AUTOSCALE TDP)
            </span>
          </div>

          <button
            onClick={() => onOpenOcModal('balanced')}
            className="px-4 py-2 rounded bg-[#1f2838] hover:bg-[#28354a] text-[#7df4ff] transition-all text-xs font-mono font-semibold flex items-center gap-1.5 border border-[#00f0ff]/20 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            GLOBAL OC PROFILE
          </button>

          <button
            onClick={() => onOpenOcModal('max-hash')}
            className="px-4 py-2 rounded bg-[#00f0ff] text-[#002022] hover:brightness-110 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_16px_rgba(0,240,255,0.3)] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            MAX HASHRATE BOOST
          </button>
        </div>
      </div>

      {/* 1. INTERACTIVE 3D HARDWARE TELEMETRY SHOWCASE CARD */}
      <GpuViewer3D
        device={selectedGpu}
        rgbMode={rgbMode}
        onRgbCycle={onRgbCycle}
        onBenchmark={handleBenchmark}
        onFanAggressive={handleFanAggressive}
        onTuneVoltage={() => onOpenOcModal('balanced')}
      />

      {/* 2. FLEET OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* KPI 1: Hashrate */}
        <div className="p-4 rounded-xl bg-[#141924] border border-[#1e2533] shadow-lg flex flex-col justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#849495] uppercase font-mono tracking-wider">
              TOTAL HASHRATE
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#101520] text-[#00fe66] text-[10px] font-mono font-bold">
              +4.2% 1h
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono text-[#00f0ff] font-bold">
              {isMining ? totalHashrate.toFixed(1) : '0.0'}
            </span>
            <span className="text-sm font-mono text-[#7df4ff]">{currentAlgo.unit}</span>
          </div>
          {/* Mini Sparkline SVG */}
          <div className="w-full h-8 flex items-end pt-1">
            <svg className="w-full h-7 text-[#00f0ff]" fill="none" viewBox="0 0 120 28">
              <path
                d="M0,22 Q15,20 30,14 T60,16 T90,8 T120,5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0,22 Q15,20 30,14 T60,16 T90,8 T120,5 L120,28 L0,28 Z"
                fill="currentColor"
                fillOpacity="0.12"
              />
            </svg>
          </div>
          <div className="flex justify-between items-center text-[#849495] text-[11px] font-mono pt-1">
            <span>
              RandomX: <strong className="text-white">4.2 kH/s</strong>
            </span>
            <span>
              {currentAlgo.name}:{' '}
              <strong className="text-white">
                {isMining ? totalHashrate.toFixed(1) : '0.0'}
              </strong>
            </span>
          </div>
        </div>

        {/* KPI 2: Algorithm Matrix */}
        <div className="p-4 rounded-xl bg-[#141924] border border-[#1e2533] shadow-lg flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#849495] uppercase font-mono tracking-wider">
              ALGORITHM MATRIX
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#00f0ff]">alt_route</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-bold">{currentAlgo.coin}</span>
              <span className="text-[10px] text-[#00fe66] font-mono">DUAL MINING</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded bg-[#1e2738] text-[#00f0ff] text-[10px] font-mono font-bold">
                {currentAlgo.name} (GPU)
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1e2738] text-[#00fe66] text-[10px] font-mono">
                RandomX (CPU)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[#849495] text-[11px] font-mono pt-1">
            <span>DAG: {currentAlgo.dagSizeGb} GB</span>
            <span className="text-[#00f0ff]">Epoch #{currentAlgo.currentEpoch}</span>
          </div>
        </div>

        {/* KPI 3: Power Consumption */}
        <div className="p-4 rounded-xl bg-[#141924] border border-[#1e2533] shadow-lg flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#849495] uppercase font-mono tracking-wider">
              POWER DRAW
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#ffb703]">
              electric_bolt
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono text-white font-bold">
              {isMining ? totalPowerWatts : 45}
            </span>
            <span className="text-sm font-mono text-[#849495]">W</span>
          </div>
          <div className="w-full bg-[#101520] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#00f0ff] h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalPowerWatts / 1500) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[#849495] text-[11px] font-mono">
            <span>
              Cost: <strong className="text-white">${dailyElecCost.toFixed(2)}/d</strong>
            </span>
            <span>
              Tariff: <strong className="text-white">${electricityTariffKwh}/kWh</strong>
            </span>
          </div>
        </div>

        {/* KPI 4: Stratum Pool Status */}
        <div className="p-4 rounded-xl bg-[#141924] border border-[#1e2533] shadow-lg flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#849495] uppercase font-mono tracking-wider">
              STRATUM STATUS
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00fe66] shadow-[0_0_8px_#00fe66]" />
              <span className="text-xs text-[#00fe66] font-mono font-bold">18ms</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-white font-bold font-mono truncate">
              2Miners & SupportXMR
            </span>
            <span className="text-xs text-[#849495] font-mono">
              Shares: 3,902 / 3 Rej
            </span>
          </div>
          <div className="flex items-center justify-between text-[#849495] text-[11px] font-mono pt-1">
            <span>Stale Rate:</span>
            <span className="text-[#00fe66] font-bold">0.02%</span>
          </div>
        </div>

        {/* KPI 5: 24h Estimated Revenue */}
        <div className="p-4 rounded-xl bg-[#141924] border border-[#1e2533] shadow-lg flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#849495] uppercase font-mono tracking-wider">
              24H EST REVENUE
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#00fe66]">
              monetization_on
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono text-[#00fe66] font-bold">
                ${(isMining ? estRevenueDaily : 0).toFixed(2)}
              </span>
              <span className="text-[10px] text-[#849495] font-mono">USD/day</span>
            </div>
            <span className="text-xs text-white font-mono font-bold">
              Net Profit: ${netDailyProfit.toFixed(2)}/d
            </span>
          </div>
          <div className="flex items-center justify-between text-[#849495] text-[11px] font-mono pt-1">
            <span>Unpaid:</span>
            <span className="text-[#00f0ff] font-bold">0.421 {currentAlgo.ticker}</span>
          </div>
        </div>
      </div>

      {/* 3. MULTI-GPU TELEMETRY MATRIX TABLE */}
      <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#00f0ff] text-[22px]">
              developer_board
            </span>
            <h3 className="text-lg text-white font-bold tracking-tight font-display">
              GPU FLEET MATRIX CONTROLLER
            </h3>
            <span className="px-2 py-0.5 rounded bg-[#1b2333] text-[#849495] text-xs font-mono">
              {gpus.length} NODES READY
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClickSound();
                onOpenOcModal('balanced');
              }}
              className="px-3 py-1.5 rounded bg-[#1b2333] hover:bg-[#253045] text-white text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">sync</span>
              SYNC ALL PROFILES
            </button>
            <button
              onClick={handleDumpLog}
              className="px-3 py-1.5 rounded bg-[#1b2333] hover:bg-[#253045] text-white text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">file_download</span>
              EXPORT OC MAP
            </button>
          </div>
        </div>

        {/* Responsive Fleet Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="text-[#849495] text-[11px] uppercase font-mono bg-[#0b0e15]/60 border-b border-[#1e2533]">
                <th className="py-2.5 px-3">DEVICE / ARCH</th>
                <th className="py-2.5 px-2">ALGO</th>
                <th className="py-2.5 px-2 text-right">HASHRATE</th>
                <th className="py-2.5 px-2 text-center">CORE / VRAM</th>
                <th className="py-2.5 px-2 text-center">FAN %</th>
                <th className="py-2.5 px-2 text-right">POWER</th>
                <th className="py-2.5 px-2 text-center">SHARES (A/R)</th>
                <th className="py-2.5 px-3">TUNER (PL% / CORE / MEM)</th>
                <th className="py-2.5 px-2 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2533]/50 text-xs font-mono">
              {gpus.map((gpu, index) => {
                const isSelected = selectedGpuIndex === index;
                const eff = (gpu.hashrate / Math.max(1, gpu.powerDrawWatts)).toFixed(2);
                return (
                  <tr
                    key={gpu.id}
                    onClick={() => {
                      setSelectedGpuIndex(index);
                      playClickSound();
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#1b2538] hover:bg-[#1e2a3f]'
                        : 'hover:bg-[#161c28]'
                    }`}
                  >
                    {/* Device */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            gpu.status === 'mining'
                              ? 'bg-[#00fe66] shadow-[0_0_8px_#00fe66]'
                              : gpu.status === 'benchmarking'
                              ? 'bg-[#00f0ff] animate-ping'
                              : 'bg-[#ffb703]'
                          }`}
                        />
                        <div className="flex flex-col">
                          <span
                            className={`font-bold ${
                              isSelected ? 'text-[#00f0ff]' : 'text-white'
                            }`}
                          >
                            GPU #{gpu.id}: {gpu.name.split(' ')[2]} {gpu.name.split(' ')[3]}
                          </span>
                          <span className="text-[10px] text-[#849495]">{gpu.architecture}</span>
                        </div>
                      </div>
                    </td>

                    {/* Algo */}
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded bg-[#101520] text-[#00f0ff] text-[10px]">
                        {currentAlgo.name}
                      </span>
                    </td>

                    {/* Hashrate */}
                    <td className="py-3 px-2 text-right">
                      <span className="text-white font-bold text-sm">
                        {isMining ? gpu.hashrate.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-[#00f0ff] text-[10px] ml-1">{currentAlgo.unit}</span>
                    </td>

                    {/* Temps */}
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`font-bold ${
                          gpu.coreTemp < 60
                            ? 'text-[#00fe66]'
                            : gpu.coreTemp < 72
                            ? 'text-[#00f0ff]'
                            : 'text-[#ffb703]'
                        }`}
                      >
                        {gpu.coreTemp}°C
                      </span>
                      <span className="text-[#849495]"> / </span>
                      <span className="text-white font-bold">{gpu.vramTemp}°C</span>
                    </td>

                    {/* Fan */}
                    <td className="py-3 px-2 text-center">
                      <span className="text-[#00f0ff] font-bold">{gpu.fanSpeedPercent}%</span>
                      <span className="text-[#849495] text-[10px] block">{gpu.fanRpm} RPM</span>
                    </td>

                    {/* Power */}
                    <td className="py-3 px-2 text-right">
                      <span className="text-white font-bold">{gpu.powerDrawWatts} W</span>
                      <span className="text-[#849495] text-[10px] block">{eff} MH/W</span>
                    </td>

                    {/* Shares */}
                    <td className="py-3 px-2 text-center">
                      <span className="text-[#00fe66] font-bold">{gpu.sharesAccepted}</span>
                      <span className="text-[#ff6b6b] font-bold"> / {gpu.sharesRejected}</span>
                    </td>

                    {/* Tuner Sliders & Controls */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1 min-w-[220px]">
                        <div className="flex justify-between text-[10px] text-[#849495]">
                          <span>PL: {gpu.powerLimitPercent}%</span>
                          <span>
                            {gpu.coreOffsetMhz >= 0 ? `+${gpu.coreOffsetMhz}` : gpu.coreOffsetMhz}C
                          </span>
                          <span>+{gpu.memOffsetMhz}M</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="55"
                            max="115"
                            value={gpu.powerLimitPercent}
                            onChange={(e) =>
                              onUpdateGpu(gpu.id, { powerLimitPercent: Number(e.target.value) })
                            }
                            className="w-full accent-[#00f0ff] bg-[#101520] h-1.5 rounded cursor-pointer"
                            title="Adjust Power Limit %"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          playFanRampSound();
                          onUpdateGpu(gpu.id, {
                            status: gpu.status === 'mining' ? 'paused' : 'mining',
                          });
                        }}
                        className="p-1 rounded hover:bg-[#1e2533] text-[#849495] hover:text-[#00f0ff] transition-all"
                        title={gpu.status === 'mining' ? 'Pause GPU thread' : 'Resume GPU thread'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {gpu.status === 'mining' ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. LIVE HASHRATE & THERMAL HISTORY DUAL-CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart A: Hashrate Equilibrium */}
        <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] text-[#849495] uppercase font-mono tracking-wider">
                HASHRATE EQUILIBRIUM ({chartTimeframe.toUpperCase()})
              </span>
              <h4 className="text-base text-white font-bold font-display">
                Reported vs. Pool Calculated
              </h4>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#00f0ff]">
                <span className="w-2.5 h-1 bg-[#00f0ff] rounded" /> Local: {totalHashrate.toFixed(1)} MH/s
              </span>
              <span className="flex items-center gap-1.5 text-[#00fe66]">
                <span className="w-2.5 h-1 bg-[#00fe66] rounded" /> Pool: {(totalHashrate * 0.991).toFixed(1)} MH/s
              </span>
              <div className="flex items-center gap-1 bg-[#101520] p-0.5 rounded text-[10px]">
                {(['1h', '12h', '24h'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      playClickSound();
                      setChartTimeframe(tf);
                    }}
                    className={`px-1.5 py-0.5 rounded ${
                      chartTimeframe === tf ? 'bg-[#1f2838] text-[#00f0ff]' : 'text-[#849495]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative w-full h-44 bg-[#0b0e15]/70 rounded-lg p-2 flex flex-col justify-between overflow-hidden border border-[#1e2533]/50">
            <div className="absolute inset-0 flex flex-col justify-between py-2 px-3 pointer-events-none opacity-20">
              <div className="border-b border-[#3b494b] w-full" />
              <div className="border-b border-[#3b494b] w-full" />
              <div className="border-b border-[#3b494b] w-full" />
              <div className="border-b border-[#3b494b] w-full" />
            </div>

            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 160">
              {/* Pool line dashed */}
              <path
                className="text-[#00fe66]"
                d="M 0 82 Q 50 67, 100 86 T 200 72 T 300 88 T 400 69 T 500 73"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              {/* Local line solid */}
              <path
                className="text-[#00f0ff]"
                d="M 0 74 C 40 70, 80 78, 120 72 C 160 66, 200 75, 240 71 C 280 68, 320 73, 360 70 C 400 67, 450 71, 500 69"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              {/* Area gradient */}
              <path
                className="text-[#00f0ff]"
                d="M 0 74 C 40 70, 80 78, 120 72 C 160 66, 200 75, 240 71 C 280 68, 320 73, 360 70 C 400 67, 450 71, 500 69 L 500 160 L 0 160 Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </svg>

            <div className="flex justify-between items-center text-[#849495] text-[10px] font-mono z-10 px-1">
              <span>-{chartTimeframe} (181.2 MH)</span>
              <span>Midpoint</span>
              <span>NOW ({totalHashrate.toFixed(1)} MH)</span>
            </div>
          </div>
        </div>

        {/* Chart B: Thermal Dynamics */}
        <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] text-[#849495] uppercase font-mono tracking-wider">
                THERMAL DYNAMICS
              </span>
              <h4 className="text-base text-white font-bold font-display">
                Die Temp & Fan Curve Correlation
              </h4>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#ffb703]">
                <span className="w-2.5 h-1 bg-[#ffb703] rounded" /> Core Temp (°C)
              </span>
              <span className="flex items-center gap-1.5 text-[#00f0ff]">
                <span className="w-2.5 h-1 bg-[#00f0ff] rounded" /> Fan Speed (%)
              </span>
              <span className="flex items-center gap-1.5 text-[#ff6b6b]">
                <span className="w-2.5 h-0.5 bg-[#ff6b6b] rounded" /> Limit (85°C)
              </span>
            </div>
          </div>

          <div className="relative w-full h-44 bg-[#0b0e15]/70 rounded-lg p-2 flex flex-col justify-between overflow-hidden border border-[#1e2533]/50">
            {/* Limit line */}
            <div className="absolute top-7 left-0 right-0 border-b border-[#ff6b6b]/40 flex justify-end px-3">
              <span className="text-[9px] text-[#ff6b6b] font-mono">THROTTLE LIMIT 85°C</span>
            </div>

            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 160">
              {/* Fan line */}
              <path
                className="text-[#00f0ff]"
                d="M 0 110 Q 70 120, 140 95 T 280 85 T 420 80 T 500 78"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              {/* Temp line */}
              <path
                className="text-[#ffb703]"
                d="M 0 95 Q 60 85, 120 100 T 260 88 T 380 92 T 500 90"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>

            <div className="flex justify-between items-center text-[#849495] text-[10px] font-mono z-10 px-1">
              <span>Avg Die: 58.7°C</span>
              <span>Avg VRAM: 72.8°C</span>
              <span>Hotspot: 67.4°C</span>
              <span>Ambient: 21.0°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TERMINAL MINER OUTPUT & EVENT LOG */}
      <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#1e2533] flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00fe66] text-[20px]">terminal</span>
            <span className="text-base text-white font-bold font-display tracking-tight">
              NEXUS_MINER // DAEMON LIVE STREAM
            </span>
            <span className="px-2 py-0.5 rounded bg-[#1b2333] text-[#00fe66] text-[10px] font-mono">
              PID: 49102 [RUNNING]
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="hidden sm:flex items-center gap-1 bg-[#101520] p-0.5 rounded text-[10px] font-mono">
              {(['all', 'share', 'thermal', 'system'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-2 py-0.5 rounded uppercase ${
                    logFilter === f ? 'bg-[#1e2738] text-[#00f0ff] font-bold' : 'text-[#849495]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={onClearLogs}
              className="px-2.5 py-1 rounded bg-[#1b2333] hover:bg-[#253045] text-[#849495] hover:text-white text-xs font-mono transition-all"
            >
              CLEAR
            </button>
            <button
              onClick={handleDumpLog}
              className="px-2.5 py-1 rounded bg-[#1b2333] hover:bg-[#253045] text-[#00f0ff] text-xs font-mono flex items-center gap-1 transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">save</span>
              DUMP LOG
            </button>
          </div>
        </div>

        {/* Hacker Terminal Window */}
        <div className="w-full bg-[#080b11] p-4 rounded-lg font-mono text-xs leading-relaxed overflow-x-auto flex flex-col gap-1.5 max-h-56 overflow-y-auto border-l-2 border-[#00f0ff]">
          {filteredLogs.map((log) => (
            <div key={log.id} className="text-[#849495] hover:text-white transition-colors">
              <span className="text-[#00f0ff] font-bold">[{log.timestamp}]</span>
              <span
                className={`font-semibold ml-1.5 ${
                  log.type === 'share'
                    ? 'text-[#00fe66]'
                    : log.type === 'block'
                    ? 'text-[#ffb703] font-bold'
                    : log.type === 'thermal'
                    ? 'text-[#7df4ff]'
                    : 'text-[#e1e2ec]'
                }`}
              >
                [{log.tag}]
              </span>{' '}
              <span className={log.highlight ? 'text-[#00fe66] font-bold' : ''}>
                {log.message}
              </span>
            </div>
          ))}
          <div className="text-[#00f0ff] flex items-center gap-1 pt-1">
            <span className="font-bold">[LIVE]</span>
            <span>&gt; Stratum dispatch keep-alive ping roundtrip: 18.2ms. All socket buffers nominal.</span>
            <span className="inline-block w-2 h-4 bg-[#00f0ff] animate-pulse ml-1" />
          </div>
        </div>

        {/* Command line prompt */}
        <form onSubmit={handleRunCommand} className="flex items-center gap-2 pt-1">
          <span className="text-[#00f0ff] font-mono text-xs font-bold">&gt;_</span>
          <input
            type="text"
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            placeholder="Type 'help', 'status', 'benchmark', 'temps', 'clr'..."
            className="flex-1 bg-[#0b0e15] border border-[#1e2533] rounded px-3 py-1.5 text-xs font-mono text-white placeholder-[#849495] focus:outline-none focus:border-[#00f0ff]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-[#1f2838] hover:bg-[#28354a] text-[#00f0ff] text-xs font-mono font-bold transition-all"
          >
            EXEC
          </button>
        </form>
      </div>
    </div>
  );
};
