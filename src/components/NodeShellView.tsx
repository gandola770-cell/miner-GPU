import React, { useEffect, useRef, useState } from 'react';
import { GpuDevice, MiningAlgorithm, TerminalLog } from '../types/miner';
import { playClickSound, playShareSound } from '../utils/sound';

interface NodeShellViewProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
  onAddLog: (log: Omit<TerminalLog, 'id' | 'timestamp'>) => void;
  gpus: GpuDevice[];
  currentAlgo: MiningAlgorithm;
  isMining: boolean;
}

export const NodeShellView: React.FC<NodeShellViewProps> = ({
  logs,
  onClearLogs,
  onAddLog,
  gpus,
  currentAlgo,
  isMining,
}) => {
  const [filter, setFilter] = useState<'all' | 'shares' | 'thermal' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [cmdInput, setCmdInput] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'shares' && log.type !== 'share' && log.type !== 'block') return false;
    if (filter === 'thermal' && log.type !== 'thermal') return false;
    if (filter === 'system' && log.type !== 'system' && log.type !== 'job') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.tag.toLowerCase().includes(q) ||
        log.timestamp.includes(q)
      );
    }
    return true;
  });

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;
    playClickSound();
    const cmd = cmdInput.trim().toLowerCase();

    if (cmd === 'help') {
      onAddLog({
        type: 'system',
        tag: 'Shell',
        message: 'Available commands: status, nodes, shares, pool, test-share, clear, exit',
      });
    } else if (cmd === 'status') {
      onAddLog({
        type: 'system',
        tag: 'Status',
        message: `MINER STATUS: ${isMining ? 'RUNNING' : 'PAUSED'} | ALGO: ${currentAlgo.name} | NODES: ${gpus.length}`,
      });
    } else if (cmd === 'nodes') {
      gpus.forEach((g) => {
        onAddLog({
          type: 'system',
          tag: 'NodeInfo',
          message: `[GPU #${g.id}] ${g.name} - ${g.hashrate} ${g.hashrateUnit} - ${g.coreTemp}°C - ${g.powerDrawWatts}W`,
        });
      });
    } else if (cmd === 'shares') {
      const totalShares = gpus.reduce((acc, g) => acc + g.sharesAccepted, 0);
      onAddLog({
        type: 'share',
        tag: 'ShareCounter',
        message: `Total Accepted Shares: ${totalShares} | Rejected: 3 | Efficiency: 99.98%`,
      });
    } else if (cmd === 'test-share') {
      playShareSound();
      onAddLog({
        type: 'block',
        tag: currentAlgo.name,
        message: `GPU #0: Share accepted (16ms) diff: 320.0G [NEW BLOCK FOUND - REWARD ACCRUED]`,
        highlight: true,
      });
    } else if (cmd === 'clear' || cmd === 'cls') {
      onClearLogs();
    } else {
      onAddLog({
        type: 'system',
        tag: 'Shell',
        message: `Command not recognized: "${cmdInput}". Type "help" for command list.`,
      });
    }
    setCmdInput('');
  };

  const handleExport = () => {
    playClickSound();
    const content = logs.map((l) => `[${l.timestamp}] [${l.tag}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_miner_shell_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInjectShare = () => {
    playShareSound();
    onAddLog({
      type: 'share',
      tag: currentAlgo.name,
      message: `GPU #${Math.floor(Math.random() * 4)}: Share accepted (18ms) diff: 128.0G`,
    });
  };

  return (
    <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-[1720px] mx-auto w-full flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#121722] border border-[#1e2533] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00fe66]/10 border border-[#00fe66]/30 flex items-center justify-center text-[#00fe66]">
            <span className="material-symbols-outlined text-[24px]">terminal</span>
          </div>
          <div>
            <h1 className="text-xl text-white font-bold font-display tracking-tight">
              NODE SHELL & DAEMON LIVE CONSOLE
            </h1>
            <p className="text-xs text-[#849495] font-mono">
              Direct telemetry socket stream from PID 49102 (Nexus Stratum Daemon).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleInjectShare}
            className="px-3 py-1.5 rounded bg-[#101520] hover:bg-[#1b2538] text-[#00fe66] border border-[#00fe66]/30 text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">send</span>
            INJECT TEST SHARE
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded bg-[#1b2538] hover:bg-[#253045] text-white text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">file_download</span>
            EXPORT LOG
          </button>
          <button
            onClick={onClearLogs}
            className="px-3 py-1.5 rounded bg-[#1b2538] hover:bg-[#253045] text-[#ff6b6b] text-xs font-mono transition-all"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="rounded-xl bg-[#080b11] border border-[#1e2533] shadow-2xl flex flex-col flex-1 min-h-[520px]">
        {/* Terminal Sub-header toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-[#1e2533] flex-wrap gap-3">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-[#101520] p-1 rounded text-xs font-mono">
            {(['all', 'shares', 'thermal', 'system'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  playClickSound();
                  setFilter(tab);
                }}
                className={`px-3 py-1 rounded uppercase transition-colors ${
                  filter === tab
                    ? 'bg-[#1b2538] text-[#00f0ff] font-bold shadow-sm'
                    : 'text-[#849495] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search box & Auto-scroll toggle */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search log output..."
                className="bg-[#101520] border border-[#1e2533] rounded px-3 py-1 text-xs font-mono text-white placeholder-[#849495] focus:outline-none focus:border-[#00f0ff] w-48 sm:w-60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1 text-[#849495] hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>

            <label className="flex items-center gap-1.5 text-xs font-mono text-[#849495] cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-[#00f0ff]"
              />
              <span>Auto-scroll</span>
            </label>
          </div>
        </div>

        {/* Console stream body */}
        <div
          ref={logContainerRef}
          className="flex-1 p-4 font-mono text-xs leading-relaxed overflow-y-auto max-h-[580px] flex flex-col gap-1.5 select-text"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-[#849495] italic py-8 text-center">
              No matching log records found for "{searchQuery}".
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="text-[#849495] hover:text-white transition-colors">
                <span className="text-[#00f0ff] font-bold">[{log.timestamp}]</span>
                <span
                  className={`font-semibold ml-2 ${
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
            ))
          )}

          <div className="text-[#00f0ff] flex items-center gap-1 pt-2">
            <span className="font-bold">[DAEMON]</span>
            <span>&gt; Stratum buffer active. Listening on socket fd#12...</span>
            <span className="inline-block w-2 h-4 bg-[#00f0ff] animate-pulse ml-1" />
          </div>
        </div>

        {/* Command line footer */}
        <form onSubmit={handleCommand} className="flex items-center gap-2 p-3 border-t border-[#1e2533] bg-[#0c1018]">
          <span className="text-[#00fe66] font-mono text-xs font-bold pl-2">root@nexus-rig04:~#</span>
          <input
            type="text"
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            placeholder="Type 'help', 'status', 'nodes', 'shares', 'test-share', 'clear'..."
            className="flex-1 bg-transparent text-xs font-mono text-white placeholder-[#849495] focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#00f0ff] text-[#002022] font-mono font-bold text-xs hover:brightness-110 transition-all"
          >
            ENTER
          </button>
        </form>
      </div>
    </div>
  );
};
