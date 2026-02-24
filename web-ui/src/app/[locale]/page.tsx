'use client';
import { useState, useEffect } from 'react';
import SubscriptionPanel, { Subscription } from '@/components/SubscriptionPanel';
import NodeModal from '@/components/NodeModal';
import ActionBox from '@/components/ActionBox';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('Index');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proxiesText, setProxiesText] = useState('');
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [configType, setConfigType] = useState('mihomo');

  // Load a default sub row on mount
  useEffect(() => {
    setSubs([{ id: Date.now(), name: '', url: '' }]);
  }, []);

  const handleInjectNode = (uri: string) => {
    setProxiesText(prev => prev ? prev + '\n' + uri : uri);
    
    // Optional: could add visual flash to textarea here
    const el = document.getElementById('proxies-textarea');
    if (el) {
      el.classList.add('ring-2', 'ring-green-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-green-500'), 500);
    }
  };

  return (
    <main className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 animate-slideup relative overflow-hidden">
      
      {/* Top Controls */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-br from-blue-600 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
            {t('title')}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm sm:text-base">
            {t('description')}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 font-medium text-sm rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {t('addNode')}
        </button>
      </div>

      {/* Proxies Section */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="proxies" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('proxiesLabel')}
          </label>
          <span className="text-xs text-gray-400 dark:text-slate-500">{t('proxiesSubLabel')}</span>
        </div>
        <textarea 
          id="proxies-textarea"
          value={proxiesText}
          onChange={(e) => setProxiesText(e.target.value)}
          placeholder={t('proxiesPlaceholder')}
          spellCheck="false"
          className="w-full min-h-[140px] p-4 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono resize-y"
        />
      </div>

      {/* External Subscriptions Section */}
      <SubscriptionPanel subs={subs} setSubs={setSubs} />

      {/* Target Target Configuration */}
      <div className="mb-8 space-y-2">
        <label htmlFor="configType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('templateLabel')}
        </label>
        <div className="relative">
          <select 
            id="configType" 
            value={configType}
            onChange={(e) => setConfigType(e.target.value)}
            className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer appearance-none pr-10"
          >
            <option value="mihomo">Mihomo / Clash Meta</option>
            <option value="stash">Stash iOS (Full Rules)</option>
            <option value="stash-mini">Stash iOS Mini (Low memory &lt;50MB)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
          </div>
        </div>
      </div>

      {/* Actions & Result */}
      <ActionBox proxiesText={proxiesText} subs={subs} configType={configType} />

      {/* Modals */}
      <NodeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onInject={handleInjectNode} 
      />

    </main>
  );
}
