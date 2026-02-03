
import React, { useEffect, useRef } from 'react';
import { TerminalLine } from '../types';

interface TerminalProps {
  lines: TerminalLine[];
  onCommand?: (cmd: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ lines }) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const getLineColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-rose-400';
      case 'warning': return 'text-amber-400';
      case 'input': return 'text-sky-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="bg-black/80 rounded-lg p-4 font-mono text-sm h-[400px] overflow-y-auto border border-slate-700 shadow-2xl">
      <div className="flex gap-2 mb-4 border-b border-slate-800 pb-2">
        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
        <span className="ml-2 text-slate-500 text-xs">telegram_extractor_cli — zsh</span>
      </div>
      {lines.map((line, idx) => (
        <div key={idx} className={`mb-1 break-all ${getLineColor(line.type)}`}>
          {line.type === 'input' && <span className="mr-2">$</span>}
          {line.text}
        </div>
      ))}
      <div ref={terminalEndRef} />
    </div>
  );
};

export default Terminal;
