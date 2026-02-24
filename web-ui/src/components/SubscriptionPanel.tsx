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

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          External Subscriptions <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
      </div>
      <div className="space-y-3">
        {subs.map(sub => (
          <div key={sub.id} className="flex items-start gap-2 animate-fadein">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input 
                type="text" 
                placeholder="Name (e.g. Provider1)" 
                value={sub.name}
                onChange={(e) => updateSub(sub.id, 'name', e.target.value)}
                className="col-span-1 p-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <input 
                type="text" 
                placeholder="https://..." 
                value={sub.url}
                onChange={(e) => updateSub(sub.id, 'url', e.target.value)}
                className="col-span-1 sm:col-span-2 p-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
              />
            </div>
            <button 
              onClick={() => removeSubRow(sub.id)}
              className="shrink-0 p-3 mt-1 sm:mt-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" 
              title="Remove Provider"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button 
        onClick={addSubRow}
        className="w-full py-3 border border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:text-blue-600 hover:border-blue-400 dark:hover:text-blue-400 dark:hover:border-blue-500 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Add Subscription Provider
      </button>
    </div>
  );
}
