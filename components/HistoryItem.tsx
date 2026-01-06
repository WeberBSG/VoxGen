
import React from 'react';
import { AudioHistoryItem } from '../types';
import { Download, Trash2 } from 'lucide-react';

interface HistoryItemProps {
  item: AudioHistoryItem;
  onDelete: (id: string) => void;
  darkMode?: boolean;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item, onDelete, darkMode = true }) => {
  const itemClasses = darkMode
    ? "bg-slate-800 border-slate-700 hover:border-slate-500"
    : "bg-white border-slate-200 hover:border-indigo-300 shadow-sm";

  const badgeClasses = darkMode
    ? "bg-slate-700 text-slate-400"
    : "bg-slate-100 text-slate-600";

  return (
    <div className={`border rounded-lg p-3 sm:p-4 flex flex-col gap-3 transition-all ${itemClasses}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm font-medium truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`} title={item.text}>
            {item.text}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1.5 text-[9px] sm:text-[10px]">
            <span className={`px-1.5 py-0.5 rounded ${badgeClasses}`}>{item.voiceName}</span>
            <span className={`px-1.5 py-0.5 rounded ${badgeClasses}`}>{item.style}</span>
            <span className="text-slate-500 flex items-center">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <button 
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-red-500 transition p-1 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      <div className={`flex items-center gap-2 p-1.5 sm:p-2 rounded ${darkMode ? 'bg-slate-900/40' : 'bg-slate-50 border border-slate-100'}`}>
        <audio src={item.blobUrl} controls className="w-full h-7 sm:h-8" />
        <a 
          href={item.blobUrl} 
          download={`voxgen_${item.timestamp}.wav`}
          className="p-1.5 sm:p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition flex-shrink-0 shadow-sm"
          title="Download WAV"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </a>
      </div>
    </div>
  );
};
