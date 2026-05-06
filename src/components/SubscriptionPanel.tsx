'use client';
import { Dispatch, SetStateAction } from 'react';

export interface Subscription {
  id: number;
  name: string;
  url: string;
}

interface Props {
  subs: Subscription[];
  setSubs: Dispatch<SetStateAction<Subscription[]>>;
}

export default function SubscriptionPanel({ subs, setSubs }: Props) {
  const addSubRow = () => {
    setSubs([...subs, { id: Date.now(), name: '', url: '' }]);
  };

  const removeSubRow = (id: number) => {
    setSubs(subs.filter(s => s.id !== id));
  };

  const updateSub = (id: number, field: 'name' | 'url', value: string) => {
    setSubs(subs.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const isSafeName = (name: string) => /^[a-zA-Z0-9_\u4e00-\u9fa5]*$/.test(name);
  const isUrl = (url: string) => url === '' || /^https?:\/\/.+/.test(url);
  const getDuplicateNames = () => {
    const names = subs.map(s => s.name.trim()).filter(n => n !== '');
    return names.filter((name, index) => names.indexOf(name) !== index);
  };
  const duplicates = getDuplicateNames();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {subs.map(sub => {
          const nameSafe = isSafeName(sub.name);
          const urlValid = isUrl(sub.url);
          const isDuplicate = sub.name.trim() !== '' && duplicates.includes(sub.name.trim());
          const hasError = !nameSafe || !urlValid || isDuplicate;

          return (
            <div key={sub.id} className="group flex flex-col gap-1.5 transition-all">
              <div className="flex items-center gap-2 relative">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <input 
                      type="text" 
                      placeholder="Provider Name" 
                      value={sub.name}
                      onChange={(e) => updateSub(sub.id, 'name', e.target.value)}
                      className={`w-full modern-input !py-2.5 font-semibold placeholder:text-white/10 ${!nameSafe || isDuplicate ? '!border-red-500/30 !bg-red-500/5 !text-red-400' : ''}`}
                    />
                  </div>
                  <div className="sm:col-span-8">
                    <input 
                      type="text" 
                      placeholder="Subscription URL" 
                      value={sub.url}
                      onChange={(e) => updateSub(sub.id, 'url', e.target.value)}
                      className={`w-full modern-input !py-2.5 font-mono text-[11px] placeholder:text-white/10 ${!urlValid ? '!border-red-500/30 !bg-red-500/5 !text-red-400' : ''}`}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => removeSubRow(sub.id)}
                  className="p-2.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all absolute -right-12 shrink-0 border border-white/5 bg-white/[0.02]" 
                  title="Remove"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {hasError && (
                <div className="flex items-center gap-1.5 pl-4">
                  <div className="w-1 h-1 rounded-full bg-red-500" />
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                    {!nameSafe ? 'Invalid Syntax' : isDuplicate ? 'Conflict: Name Exists' : 'Invalid Connection Protocol'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button 
        onClick={addSubRow}
        className="group text-[12px] font-bold text-blue-400 hover:text-blue-300 transition-all py-3 flex items-center gap-2 uppercase tracking-widest px-1"
      >
        <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </div>
        Append Remote Provider
      </button>
    </div>
  );
}
