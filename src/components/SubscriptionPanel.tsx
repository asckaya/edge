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
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        {subs.map(sub => {
          const nameSafe = isSafeName(sub.name);
          const urlValid = isUrl(sub.url);
          const isDuplicate = sub.name.trim() !== '' && duplicates.includes(sub.name.trim());
          const hasError = !nameSafe || !urlValid || isDuplicate;

          return (
            <div key={sub.id} className="group flex flex-col gap-1 transition-all">
              <div className="flex items-center gap-2 relative">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <input 
                      type="text" 
                      placeholder="Provider Name" 
                      value={sub.name}
                      onChange={(e) => updateSub(sub.id, 'name', e.target.value)}
                      className={`w-full apple-input !py-2.5 font-medium ${!nameSafe || isDuplicate ? '!border-red-500/50 !bg-red-500/5 !text-red-600 dark:!text-red-400' : ''}`}
                    />
                  </div>
                  <div className="sm:col-span-8">
                    <input 
                      type="text" 
                      placeholder="Subscription URL" 
                      value={sub.url}
                      onChange={(e) => updateSub(sub.id, 'url', e.target.value)}
                      className={`w-full apple-input !py-2.5 font-mono text-xs ${!urlValid ? '!border-red-500/50 !bg-red-500/5 !text-red-600 dark:!text-red-400' : ''}`}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => removeSubRow(sub.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all absolute -right-10 shrink-0" 
                  title="Remove"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {hasError && (
                <div className="flex items-center gap-1.5 pl-3 mt-0.5">
                  <span className="text-[11px] text-red-500 font-medium">
                    {!nameSafe ? 'Invalid name' : isDuplicate ? 'Duplicate provider' : 'Invalid URL'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button 
        onClick={addSubRow}
        className="text-[13px] font-medium text-[#0071e3] hover:text-[#0077ED] transition-colors py-2 flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Add Subscription Source
      </button>
    </div>
  );
}
