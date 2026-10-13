import React, { useState } from 'react';
import { ALGORITHMS } from '../data/mockMinerData';
import { MiningAlgorithm, MiningAlgorithmId } from '../types/miner';
import { playClickSound, playFanRampSound } from '../utils/sound';

interface FlightSheetViewProps {
  currentAlgo: MiningAlgorithm;
  onSelectAlgo: (algo: MiningAlgorithm) => void;
  poolUrl: string;
  onUpdatePoolUrl: (url: string) => void;
  walletAddress: string;
  onUpdateWallet: (addr: string) => void;
  workerName: string;
  onUpdateWorker: (name: string) => void;
  tariffKwh: number;
  onUpdateTariff: (tariff: number) => void;
  totalHashrate: number;
  totalPowerWatts: number;
}

export const FlightSheetView: React.FC<FlightSheetViewProps> = ({
  currentAlgo,
  onSelectAlgo,
  poolUrl,
  onUpdatePoolUrl,
  walletAddress,
  onUpdateWallet,
  workerName,
  onUpdateWorker,
  tariffKwh,
  onUpdateTariff,
  totalHashrate,
  totalPowerWatts,
}) => {
  const [selectedAlgoId, setSelectedAlgoId] = useState<MiningAlgorithmId>(currentAlgo.id);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [minerEngine, setMinerEngine] = useState('t-rex');

  const activeAlgo = ALGORITHMS[selectedAlgoId] || currentAlgo;

  // Revenue calculation
  const grossRevDaily = (totalHashrate / 100) * activeAlgo.estRevPer100Mh;
  const powerCostDaily = ((totalPowerWatts * 24) / 1000) * tariffKwh;
  const netProfitDaily = Math.max(0, grossRevDaily - powerCostDaily);

  const handleApplyFlightSheet = (e: React.FormEvent) => {
    e.preventDefault();
    playFanRampSound();
    onSelectAlgo(activeAlgo);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-[1720px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#121722] border border-[#1e2533] shadow-xl">
        <div>
          <span className="text-[10px] text-[#00f0ff] uppercase font-mono tracking-wider">
            // ALGORITHM & POOL FLIGHT SHEET
          </span>
          <h1 className="text-2xl text-white font-bold font-display tracking-tight">
            STRATUM DISPATCH & FLIGHT SHEETS
          </h1>
          <p className="text-xs text-[#849495] mt-1">
            Configure target proof-of-work algorithm, stratum pool credentials, and profit parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-[#101520] text-[#00fe66] text-xs font-mono border border-[#00fe66]/30">
            CURRENT FLIGHT: {currentAlgo.coin} ({currentAlgo.name})
          </span>
        </div>
      </div>

      <form onSubmit={handleApplyFlightSheet} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Algorithm and Credentials */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Algorithm Selection Cards */}
          <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 flex flex-col gap-3 shadow-xl">
            <span className="text-xs text-[#849495] uppercase font-mono tracking-wider">
              1. SELECT PROOF-OF-WORK ALGORITHM
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(ALGORITHMS).map((algo) => {
                const isSelected = selectedAlgoId === algo.id;
                return (
                  <div
                    key={algo.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedAlgoId(algo.id);
                      onUpdatePoolUrl(algo.defaultPool);
                    }}
                    className={`cursor-pointer p-4 rounded-lg border transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-[#1b2538] border-[#00f0ff] shadow-[0_0_14px_rgba(0,240,255,0.2)]'
                        : 'bg-[#101520] border-[#1e2533] hover:border-[#2a364d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm font-display">
                        {algo.coin} ({algo.ticker})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#1e2738] text-[#00f0ff] text-[10px] font-mono">
                        {algo.name}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs font-mono">
                      <span className="text-[#849495]">Est Yield:</span>
                      <span className="text-[#00fe66] font-bold">
                        ${algo.estRevPer100Mh.toFixed(2)}/100 {algo.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#849495] font-mono border-t border-[#1e2533] pt-1.5">
                      <span>DAG File: {algo.dagSizeGb} GB</span>
                      <span>Epoch #{algo.currentEpoch}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Credentials and Stratum Server */}
          <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 flex flex-col gap-4 shadow-xl">
            <span className="text-xs text-[#849495] uppercase font-mono tracking-wider">
              2. STRATUM POOL & WALLET CREDENTIALS
            </span>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#849495]">Stratum Pool Endpoint (SSL / TLS):</label>
              <input
                type="text"
                value={poolUrl}
                onChange={(e) => onUpdatePoolUrl(e.target.value)}
                className="w-full bg-[#0e131d] border border-[#1e2533] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00f0ff]"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#849495]">Wallet Address ({activeAlgo.ticker}):</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => onUpdateWallet(e.target.value)}
                className="w-full bg-[#0e131d] border border-[#1e2533] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00f0ff]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-[#849495]">Rig Worker Name:</label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => onUpdateWorker(e.target.value)}
                  className="w-full bg-[#0e131d] border border-[#1e2533] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00f0ff]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-[#849495]">Mining Software Core:</label>
                <select
                  value={minerEngine}
                  onChange={(e) => setMinerEngine(e.target.value)}
                  className="w-full bg-[#0e131d] border border-[#1e2533] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="t-rex">T-Rex Miner v0.26.8 (NVIDIA CUDA)</option>
                  <option value="gminer">GMiner v3.44 (High Efficiency)</option>
                  <option value="lolminer">lolMiner v1.82 (Mixed Rig)</option>
                  <option value="teamred">TeamRedMiner v0.10.14 (AMD OpenCL)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-[#00f0ff] hover:brightness-110 text-[#002022] font-mono text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,240,255,0.35)]"
              >
                <span className="material-symbols-outlined text-[18px]">publish</span>
                APPLY & RESTART MINER THREADS
              </button>
              {savedSuccess && (
                <div className="mt-2 text-center text-xs font-mono text-[#00fe66] animate-pulse">
                  Flight Sheet applied successfully. Generating DAG buffer on fleet...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Profitability & Electricity Calculator */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-[#141924] border border-[#1e2533] p-5 flex flex-col gap-4 shadow-xl">
            <span className="text-xs text-[#849495] uppercase font-mono tracking-wider">
              3. PROFITABILITY CALCULATOR
            </span>

            {/* Electricity slider */}
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#0e131d] border border-[#1e2533]">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#849495]">Electricity Tariff:</span>
                <span className="text-[#00f0ff] font-bold">${tariffKwh.toFixed(3)} / kWh</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.35"
                step="0.005"
                value={tariffKwh}
                onChange={(e) => onUpdateTariff(Number(e.target.value))}
                className="w-full accent-[#00f0ff] bg-[#1a212e] h-2 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#849495] font-mono">
                <span>$0.04 (Cheap Hydro)</span>
                <span>$0.35 (Peak Grid)</span>
              </div>
            </div>

            {/* Projected ledger */}
            <div className="flex flex-col gap-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-[#1e2533]">
                <span className="text-[#849495]">Est. Daily Revenue:</span>
                <span className="text-white font-bold">${grossRevDaily.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e2533]">
                <span className="text-[#849495]">Power Draw ({totalPowerWatts}W):</span>
                <span className="text-[#ff6b6b] font-bold">-${powerCostDaily.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1e2533] text-sm">
                <span className="text-white font-bold">Net Daily Profit:</span>
                <span className="text-[#00fe66] font-bold">${netProfitDaily.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#849495]">Est. Monthly Net:</span>
                <span className="text-[#00fe66] font-bold">
                  ${(netProfitDaily * 30).toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Payout Progress */}
            <div className="p-3 rounded-lg bg-[#0e131d] border border-[#1e2533] flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] text-[#849495] font-mono">
                <span>POOL PAYOUT THRESHOLD:</span>
                <span className="text-white font-bold">42% (0.421 / 1.0 {activeAlgo.ticker})</span>
              </div>
              <div className="w-full bg-[#1b2333] h-2 rounded-full overflow-hidden">
                <div className="bg-[#00fe66] h-full w-[42%]" />
              </div>
              <span className="text-[10px] text-[#849495] font-mono">
                Next automatic payout expected in ~34 hours.
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
