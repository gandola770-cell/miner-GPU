/**
 * NEXUS GPU Rig Miner & Telemetry
 * Production-grade GPU mining rig workstation with interactive 3D hardware viewer,
 * multi-GPU telemetry, real-time overclock tuner, and stratum pool monitor.
 */

import React, { useEffect, useState } from 'react';
import { ALGORITHMS, INITIAL_GPUS, INITIAL_LOGS } from './data/mockMinerData';
import { FleetTelemetryView } from './components/FleetTelemetryView';
import { FlightSheetView } from './components/FlightSheetView';
import { GpuMatrixView } from './components/GpuMatrixView';
import { Header } from './components/Header';
import { MilestoneModal } from './components/MilestoneModal';
import { NodeShellView } from './components/NodeShellView';
import { OcPresetModal } from './components/OcPresetModal';
import { OcTunerView } from './components/OcTunerView';
import { Sidebar } from './components/Sidebar';
import { ThermalPowerView } from './components/ThermalPowerView';
import {
  GpuDevice,
  MiningAlgorithm,
  OcPresetType,
  RgbMode,
  TerminalLog,
  ThermalAlert,
  ViewTab,
} from './types/miner';
import { playClickSound, playFanRampSound, playShareSound } from './utils/sound';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('fleet-telemetry');
  const [gpus, setGpus] = useState<GpuDevice[]>(INITIAL_GPUS);
  const [currentAlgo, setCurrentAlgo] = useState<MiningAlgorithm>(ALGORITHMS.kawpow);
  const [isMining, setIsMining] = useState(true);
  const [poolUrl, setPoolUrl] = useState(ALGORITHMS.kawpow.defaultPool);
  const [walletAddress, setWalletAddress] = useState('RNexUs482xr9Alpha78291040182XMRbvQ');
  const [workerName, setWorkerName] = useState('NEXUS-RIG-04');
  const [tariffKwh, setTariffKwh] = useState(0.11);
  const [logs, setLogs] = useState<TerminalLog[]>(INITIAL_LOGS);
  const [rgbMode, setRgbMode] = useState<RgbMode>('cyan');
  const [activeProfile, setActiveProfile] = useState<string>('PROD_BALANCED');
  const [isOcModalOpen, setIsOcModalOpen] = useState(false);
  const [ocModalInitialPreset, setOcModalInitialPreset] = useState<OcPresetType>('balanced');
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(2);
  const [activeThermalAlert, setActiveThermalAlert] = useState<ThermalAlert | null>(null);

  // Calculate live aggregate fleet metrics
  const totalHashrate = gpus.reduce(
    (acc, g) => (g.status === 'mining' ? acc + g.hashrate : acc),
    0
  );
  const totalPowerWatts = isMining
    ? gpus.reduce((acc, g) => (g.status === 'mining' ? acc + g.powerDrawWatts : acc + 15), 0)
    : 45;
  const estRevenueDaily = (totalHashrate / 100) * currentAlgo.estRevPer100Mh;

  // Real-time mining simulation interval
  useEffect(() => {
    if (!isMining) return;

    const interval = setInterval(() => {
      // Pick random GPU to find a share
      const randomGpuIndex = Math.floor(Math.random() * gpus.length);
      const isBlockCandidate = Math.random() < 0.12;
      const latencyMs = Math.floor(Math.random() * 18) + 16;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      // Increment accepted share on the GPU
      setGpus((prev) =>
        prev.map((g, idx) => {
          if (idx === randomGpuIndex && g.status === 'mining') {
            // Slight natural micro-fluctuation in hashrate & power
            const deltaH = (Math.random() - 0.5) * 0.4;
            const deltaP = Math.floor((Math.random() - 0.5) * 3);
            return {
              ...g,
              hashrate: Math.max(10, +(g.hashrate + deltaH).toFixed(1)),
              powerDrawWatts: Math.max(80, g.powerDrawWatts + deltaP),
              sharesAccepted: g.sharesAccepted + 1,
            };
          }
          return g;
        })
      );

      // Play soft chime if user enabled sound
      if (isBlockCandidate) {
        playShareSound();
      }

      // Add log entry
      const newLog: TerminalLog = {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        type: isBlockCandidate ? 'block' : 'share',
        tag: currentAlgo.name,
        message: isBlockCandidate
          ? `GPU #${randomGpuIndex}: Share accepted (${latencyMs}ms) diff: ${(
              Math.random() * 180 +
              140
            ).toFixed(1)}G [BLOCK CANDIDATE EVALUATED]`
          : `GPU #${randomGpuIndex}: Share accepted (${latencyMs}ms) [Target match: 0x000000000${Math.random()
              .toString(16)
              .substring(2, 8)}...]`,
        highlight: isBlockCandidate,
      };

      setLogs((prev) => [...prev.slice(-150), newLog]);
    }, 4200);

    return () => clearInterval(interval);
  }, [isMining, currentAlgo.name, gpus.length]);

  // Periodic Thermal Watchdog poll log
  useEffect(() => {
    if (!isMining) return;
    const watchdogInterval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const watchdogLog: TerminalLog = {
        id: `log-watchdog-${Date.now()}`,
        timestamp: timeStr,
        type: 'thermal',
        tag: 'ThermalWatchdog',
        message: `Polling sensor array: GPU0: ${gpus[0]?.coreTemp}°C, GPU1: ${gpus[1]?.coreTemp}°C, GPU2: ${gpus[2]?.coreTemp}°C, GPU3: ${gpus[3]?.coreTemp}°C. Delta: Nominal OK.`,
      };

      setLogs((prev) => [...prev.slice(-150), watchdogLog]);
    }, 18000);

    return () => clearInterval(watchdogInterval);
  }, [isMining, gpus]);

  // Surveillance: automatically trigger visual notification toast in Header if any GPU core temperature > 85°C
  useEffect(() => {
    const hotGpu = gpus.find((g) => g.coreTemp > 85);
    if (hotGpu) {
      if (!activeThermalAlert || activeThermalAlert.gpuId !== hotGpu.id || hotGpu.coreTemp > activeThermalAlert.coreTemp) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        setActiveThermalAlert({
          id: `thermal-${hotGpu.id}-${Date.now()}`,
          gpuId: hotGpu.id,
          gpuName: hotGpu.name,
          coreTemp: hotGpu.coreTemp,
          vramTemp: hotGpu.vramTemp,
          threshold: 85,
          timestamp: timeStr,
        });

        // Log urgent warning to daemon stream
        setLogs((prev) => [
          ...prev,
          {
            id: `crit-alert-${Date.now()}`,
            timestamp: timeStr,
            type: 'thermal',
            tag: 'ThermalWatchdog',
            message: `CRITICAL THERMAL ALERT: GPU #${hotGpu.id} (${hotGpu.name}) core die exceeded 85°C safety limit! (Current: ${hotGpu.coreTemp}°C). Emergency throttle recommended.`,
            highlight: true,
          },
        ]);
      }
    } else if (activeThermalAlert) {
      setActiveThermalAlert(null);
    }
  }, [gpus, activeThermalAlert]);

  const handleEmergencyCool = (targetGpuId?: number) => {
    playFanRampSound();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setGpus((prev) =>
      prev.map((g) => {
        if (targetGpuId === undefined || g.id === targetGpuId || g.coreTemp > 85) {
          return {
            ...g,
            fanSpeedPercent: 100,
            fanRpm: 3200,
            powerLimitPercent: 60,
            coreTemp: 54,
            vramTemp: 68,
            hotspotTemp: 61,
          };
        }
        return g;
      })
    );

    setActiveThermalAlert(null);

    setLogs((prev) => [
      ...prev,
      {
        id: `emergency-cool-${Date.now()}`,
        timestamp: timeStr,
        type: 'thermal',
        tag: 'WatchdogRecovery',
        message: `EMERGENCY COOLING ENGAGED: Auto-throttle engaged, fans ramped to 100% turbo (3,200 RPM). Temperatures safely normalized to 54°C.`,
        highlight: true,
      },
    ]);
  };

  const handleTriggerTestHeatSpike = () => {
    playClickSound();
    setGpus((prev) =>
      prev.map((g) => {
        if (g.id === 1) {
          return {
            ...g,
            coreTemp: 87,
            vramTemp: 95,
            hotspotTemp: 92,
          };
        }
        return g;
      })
    );
  };

  const handleUpdateGpu = (id: number, partial: Partial<GpuDevice>) => {
    setGpus((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          return { ...g, ...partial };
        }
        return g;
      })
    );
  };

  const handleRgbCycle = () => {
    const modes: RgbMode[] = ['cyan', 'emerald', 'amber', 'purple', 'rainbow', 'off'];
    const nextIdx = (modes.indexOf(rgbMode) + 1) % modes.length;
    setRgbMode(modes[nextIdx]);
  };

  const handleOpenOcModal = (preset: OcPresetType = 'balanced') => {
    playClickSound();
    setOcModalInitialPreset(preset);
    setIsOcModalOpen(true);
  };

  const handleApplyPreset = (params: {
    preset: OcPresetType;
    powerLimit: number;
    coreOffset: number;
    memOffset: number;
    targetGpus: number[];
  }) => {
    const { preset, powerLimit, coreOffset, memOffset, targetGpus } = params;

    setActiveProfile(
      preset === 'eco'
        ? 'PROD_MAX_EFF'
        : preset === 'max-hash'
        ? 'PROD_MAX_HASH'
        : 'PROD_BALANCED'
    );

    setGpus((prev) =>
      prev.map((gpu) => {
        if (targetGpus.includes(gpu.id)) {
          // Adjust stats based on tuning
          let baseRate = gpu.hashrate;
          let baseWatts = gpu.powerDrawWatts;
          let baseTemp = gpu.coreTemp;

          if (preset === 'eco') {
            baseRate = +(gpu.hashrate * 0.94).toFixed(1);
            baseWatts = Math.round(gpu.powerDrawWatts * 0.8);
            baseTemp = Math.max(48, gpu.coreTemp - 8);
          } else if (preset === 'max-hash') {
            baseRate = +(gpu.hashrate * 1.08).toFixed(1);
            baseWatts = Math.round(gpu.powerDrawWatts * 1.15);
            baseTemp = Math.min(76, gpu.coreTemp + 8);
          }

          return {
            ...gpu,
            powerLimitPercent: powerLimit,
            coreOffsetMhz: coreOffset,
            memOffsetMhz: memOffset,
            hashrate: baseRate,
            powerDrawWatts: baseWatts,
            coreTemp: baseTemp,
          };
        }
        return gpu;
      })
    );

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setLogs((prev) => [
      ...prev,
      {
        id: `oc-flash-${Date.now()}`,
        timestamp: timeStr,
        type: 'system',
        tag: 'Overclock',
        message: `Flashed ${preset.toUpperCase()} profile to [${targetGpus
          .map((id) => `GPU#${id}`)
          .join(', ')}]. PL=${powerLimit}%, Core=${coreOffset}MHz, Mem=+${memOffset}MHz.`,
        highlight: true,
      },
    ]);
  };

  const handleSelectProfile = (profile: string) => {
    playClickSound();
    setActiveProfile(profile);
    if (profile === 'PROD_MAX_EFF') {
      handleApplyPreset({
        preset: 'eco',
        powerLimit: 65,
        coreOffset: -50,
        memOffset: 800,
        targetGpus: [0, 1, 2, 3],
      });
    } else if (profile === 'PROD_MAX_HASH') {
      handleApplyPreset({
        preset: 'max-hash',
        powerLimit: 105,
        coreOffset: 220,
        memOffset: 1400,
        targetGpus: [0, 1, 2, 3],
      });
    } else {
      handleApplyPreset({
        preset: 'balanced',
        powerLimit: 80,
        coreOffset: 150,
        memOffset: 1000,
        targetGpus: [0, 1, 2, 3],
      });
    }
  };

  const handleReboot = () => {
    playFanRampSound();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    setLogs((prev) => [
      ...prev,
      {
        id: `reboot-${Date.now()}`,
        timestamp: timeStr,
        type: 'system',
        tag: 'Reboot',
        message: 'RIG REBOOT INITIATED: Flushing PCIe registers and resetting GPU device tree...',
        highlight: true,
      },
    ]);

    setIsMining(false);
    setTimeout(() => {
      setIsMining(true);
      setLogs((prev) => [
        ...prev,
        {
          id: `reboot-done-${Date.now()}`,
          timestamp: timeStr,
          type: 'system',
          tag: 'Daemon',
          message: 'All 4 compute nodes initialized. Stratum handshake re-established.',
        },
      ]);
    }, 1800);
  };

  const handleSelectAlgo = (algo: MiningAlgorithm) => {
    setCurrentAlgo(algo);
    setPoolUrl(algo.defaultPool);

    // Re-scale device hashrates based on algo characteristics
    setGpus((prev) =>
      prev.map((g) => {
        let mult = 1.0;
        if (algo.id === 'ethash') mult = 1.25;
        if (algo.id === 'autolykos') mult = 1.45;
        if (algo.id === 'kaspa') mult = 12.5; // in GH/s
        return {
          ...g,
          hashrate: +(g.hashrate * mult).toFixed(1),
          hashrateUnit: algo.unit,
        };
      })
    );
  };

  return (
    <div className="bg-[#0b0e15] min-h-screen text-[#e1e2ec] font-sans antialiased flex flex-col">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        poolAddress={poolUrl}
        pingMs={18}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Control Header */}
        <Header
          isMining={isMining}
          onToggleMining={() => setIsMining(!isMining)}
          onReboot={handleReboot}
          currentAlgo={currentAlgo}
          totalHashrate={totalHashrate}
          estRevenueDaily={estRevenueDaily}
          activeProfile={activeProfile}
          onSelectProfile={handleSelectProfile}
          onOpenMilestone={() => setIsMilestoneModalOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          notificationsCount={notificationsCount}
          thermalAlert={activeThermalAlert}
          onDismissThermalAlert={() => setActiveThermalAlert(null)}
          onEmergencyCool={handleEmergencyCool}
          onTriggerTestHeatSpike={handleTriggerTestHeatSpike}
        />

        {/* View Router */}
        <main className="w-full pt-16 flex-1 flex flex-col">
          {activeTab === 'fleet-telemetry' && (
            <FleetTelemetryView
              gpus={gpus}
              onUpdateGpu={handleUpdateGpu}
              currentAlgo={currentAlgo}
              isMining={isMining}
              totalHashrate={totalHashrate}
              totalPowerWatts={totalPowerWatts}
              estRevenueDaily={estRevenueDaily}
              electricityTariffKwh={tariffKwh}
              logs={logs}
              onClearLogs={() => setLogs([])}
              onAddLog={(log) => {
                const now = new Date();
                const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                setLogs((prev) => [
                  ...prev,
                  { ...log, id: `log-${Date.now()}-${Math.random()}`, timestamp: timeStr },
                ]);
              }}
              rgbMode={rgbMode}
              onRgbCycle={handleRgbCycle}
              onOpenOcModal={handleOpenOcModal}
            />
          )}

          {activeTab === 'gpu-matrix' && (
            <GpuMatrixView
              gpus={gpus}
              currentAlgo={currentAlgo}
              onUpdateGpu={handleUpdateGpu}
              onOpenOcModal={handleOpenOcModal}
            />
          )}

          {activeTab === 'flight-sheet' && (
            <FlightSheetView
              currentAlgo={currentAlgo}
              onSelectAlgo={handleSelectAlgo}
              poolUrl={poolUrl}
              onUpdatePoolUrl={setPoolUrl}
              walletAddress={walletAddress}
              onUpdateWallet={setWalletAddress}
              workerName={workerName}
              onUpdateWorker={setWorkerName}
              tariffKwh={tariffKwh}
              onUpdateTariff={setTariffKwh}
              totalHashrate={totalHashrate}
              totalPowerWatts={totalPowerWatts}
            />
          )}

          {activeTab === 'overclock-tuning' && (
            <OcTunerView
              gpus={gpus}
              onUpdateGpu={handleUpdateGpu}
              onOpenOcModal={handleOpenOcModal}
            />
          )}

          {activeTab === 'thermal-power' && (
            <ThermalPowerView
              gpus={gpus}
              onUpdateGpu={handleUpdateGpu}
              totalPowerWatts={totalPowerWatts}
              tariffKwh={tariffKwh}
              onTriggerTestHeatSpike={handleTriggerTestHeatSpike}
            />
          )}

          {activeTab === 'node-terminal' && (
            <NodeShellView
              logs={logs}
              onClearLogs={() => setLogs([])}
              onAddLog={(log) => {
                const now = new Date();
                const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                setLogs((prev) => [
                  ...prev,
                  { ...log, id: `log-${Date.now()}-${Math.random()}`, timestamp: timeStr },
                ]);
              }}
              gpus={gpus}
              currentAlgo={currentAlgo}
              isMining={isMining}
            />
          )}
        </main>
      </div>

      {/* Overclock Preset Modal */}
      <OcPresetModal
        isOpen={isOcModalOpen}
        onClose={() => setIsOcModalOpen(false)}
        onApplyPreset={handleApplyPreset}
        initialPreset={ocModalInitialPreset}
      />

      {/* Milestone Celebration Modal */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
      />
    </div>
  );
}
