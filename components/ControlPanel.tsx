
import React from 'react';
import { TTSConfig, VoiceStyle } from '../types';
import { VOICES, STYLES } from '../constants';
import { Sliders, Mic, Activity, Gauge, Loader2, Volume2 } from 'lucide-react';

interface ControlPanelProps {
  config: TTSConfig;
  onChange: (newConfig: TTSConfig) => void;
  onPreviewVoice: (voiceId: string) => void;
  isPreviewing: boolean;
  disabled: boolean;
  darkMode?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  config, 
  onChange, 
  onPreviewVoice,
  isPreviewing,
  disabled,
  darkMode = true
}) => {
  
  const cardClasses = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-slate-200 shadow-sm";

  const inputClasses = darkMode
    ? "bg-slate-900 border-slate-600 text-slate-200"
    : "bg-slate-50 border-slate-300 text-slate-900";

  return (
    <div className={`p-4 sm:p-6 rounded-xl border shadow-xl space-y-6 transition-colors ${cardClasses}`}>
      <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 border-b pb-2 ${darkMode ? 'text-white border-slate-700' : 'text-slate-900 border-slate-200'}`}>
        <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
        Configuration
      </h2>

      {/* Voice Selector */}
      <div className="space-y-2">
        <label className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          Voice Persona
        </label>
        <div className="flex gap-2">
          <select
            value={config.voiceId}
            onChange={(e) => onChange({ ...config, voiceId: e.target.value })}
            disabled={disabled}
            className={`flex-1 border rounded-lg p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:opacity-50 ${inputClasses}`}
          >
            <optgroup label="Male Voices">
              {VOICES.filter(v => v.gender === 'Male').map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </optgroup>
            <optgroup label="Female Voices">
              {VOICES.filter(v => v.gender === 'Female').map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </optgroup>
          </select>
          <button
            onClick={() => onPreviewVoice(config.voiceId)}
            disabled={disabled || isPreviewing}
            className={`px-3 sm:px-4 rounded-lg border transition flex items-center justify-center disabled:opacity-50 min-w-[3rem] ${darkMode ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-indigo-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-indigo-600'}`}
          >
            {isPreviewing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Style Selector */}
        <div className="space-y-2">
          <label className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
            Style
          </label>
          <select
            value={config.style}
            onChange={(e) => onChange({ ...config, style: e.target.value as VoiceStyle })}
            disabled={disabled}
            className={`w-full border rounded-lg p-2 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:opacity-50 ${inputClasses}`}
          >
            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Speed Selector */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              Speed
            </label>
            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
              {config.speed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range" min="0.5" max="2.0" step="0.1" value={config.speed}
            onChange={(e) => onChange({ ...config, speed: parseFloat(e.target.value) })}
            disabled={disabled}
            className="w-full h-1.5 sm:h-2 bg-slate-700 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Pitch Selector */}
        <div className="space-y-2 sm:col-span-1">
          <div className="flex justify-between">
            <label className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              Pitch
            </label>
            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
              {config.pitch}
            </span>
          </div>
          <input
            type="range" min="-10" max="10" step="1" value={config.pitch}
            onChange={(e) => onChange({ ...config, pitch: parseFloat(e.target.value) })}
            disabled={disabled}
            className="w-full h-1.5 sm:h-2 bg-slate-700 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
