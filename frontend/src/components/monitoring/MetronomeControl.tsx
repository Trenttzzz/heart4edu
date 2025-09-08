import React from 'react';
import { useMetronome } from '../../hooks/useMetronome';
import { Play, Square } from 'lucide-react';
import { Button } from '../common/Button';

interface MetronomeControlProps {
  bpm?: number; // fixed default 100
  showBeatIndicator?: boolean;
}

export const MetronomeControl: React.FC<MetronomeControlProps> = ({ bpm = 100, showBeatIndicator = true }) => {
  const { isRunning, toggle, barBeat, beatCount } = useMetronome({ bpm });

  return (
    <div className="flex items-center gap-4 bg-white/70 backdrop-blur-sm border border-cherry-pink/40 rounded-lg px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${isRunning ? 'bg-accent animate-pulse' : 'bg-zinc-300'}`} />
        <span className="text-sm font-medium text-zinc-700">Metronome {bpm} BPM</span>
      </div>

      {showBeatIndicator && (
        <div className="flex items-center gap-1">
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-sm transition-all duration-150 ${
                barBeat === i && isRunning
                  ? 'bg-primary scale-110 shadow' 
                  : 'bg-zinc-300'
              } ${i===0 ? 'rounded-full' : ''}`}
            />
          ))}
          <span className="ml-2 text-[10px] text-zinc-500 font-mono">{beatCount}</span>
        </div>
      )}

      <Button
        variant={isRunning ? 'outline' : 'primary'}
        size="sm"
        onClick={toggle}
        className={isRunning ? 'border-rose-red text-rose-red hover:bg-rose-red hover:text-white' : 'bg-primary hover:bg-bright-pink text-white'}
      >
        {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        <span className="ml-1">{isRunning ? 'Stop' : 'Start'}</span>
      </Button>
    </div>
  );
};
