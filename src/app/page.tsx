'use client';
import { useState, useEffect } from 'react';
import SubscriptionPanel, { Subscription } from '@/components/SubscriptionPanel';
import NodeModal from '@/components/NodeModal';
import ActionBox from '@/components/ActionBox';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proxiesText, setProxiesText] = useState('');
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [configType, setConfigType] = useState('mihomo');
  const [ghProxy, setGhProxy] = useState('');

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

  const COMMON_GH_PROXIES = [
    'https://gh-proxy.com/',
    'https://mirror.ghproxy.com/',
    'https://ghproxy.net/',
    'https://gh-proxy.org/',
  ];

  const supportedProtocols = ['vless', 'vmess', 'trojan', 'ss', 'ssr', 'hysteria2', 'tuic', 'wireguard'];
  const invalidProtocols = proxiesText.split('\n')
    .map(line => line.trim())
    .filter(line => line.includes('://'))
    .map(line => line.split('://')[0].toLowerCase())
    .filter(proto => proto && !supportedProtocols.includes(proto));
  
  const hasInvalidProtocol = invalidProtocols.length > 0;

  return (
    <main className="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5 animate-slideup relative overflow-hidden">
      
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 relative">
        <div>
          <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 dark:from-blue-400 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
            Edge Subscription
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm sm:text-base font-medium max-w-sm">
            High-performance proxy subscription converter powered by Cloudflare Edge.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Node Link
        </button>
      </div>

      {/* Proxies Section */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="proxies" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Self-Hosted Proxies
          </label>
          <span className={`text-xs ${hasInvalidProtocol ? 'text-amber-500 font-medium' : 'text-gray-400 dark:text-slate-500'}`}>
            {hasInvalidProtocol ? `Warning: Unsupported protocol (${invalidProtocols[0]})` : 'vless, hysteria2, tuic...'}
          </span>
        </div>
        <textarea 
          id="proxies-textarea"
          value={proxiesText}
          onChange={(e) => setProxiesText(e.target.value)}
          placeholder={`Paste your individual proxy uris here separated by newline...\nFor example:\ntuic://uuid:password@host:port...`}
          spellCheck="false"
          className={`w-full min-h-[140px] p-4 bg-gray-50 dark:bg-slate-900 border ${hasInvalidProtocol ? 'border-amber-400 focus:ring-amber-500/50 focus:border-amber-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500/50 focus:border-blue-500'} rounded-xl text-gray-800 dark:text-slate-200 text-sm focus:outline-none transition-all font-mono resize-y`}
        />
      </div>

      {/* External Subscriptions Section */}
      <SubscriptionPanel subs={subs} setSubs={setSubs} />

      {/* GitHub Proxy Section */}
      <div className="mb-6 space-y-2">
        <label htmlFor="ghProxy" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          GitHub Proxy (gh_proxy)
        </label>
        <div className="relative">
          <input 
            id="ghProxy"
            list="gh-proxies-list"
            type="text"
            value={ghProxy}
            onChange={(e) => setGhProxy(e.target.value)}
            placeholder="e.g. https://gh-proxy.org/"
            className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
          />
          <datalist id="gh-proxies-list">
            {COMMON_GH_PROXIES.map(proxy => (
              <option key={proxy} value={proxy} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Target Target Configuration */}
      <div className="mb-8 space-y-2">
        <label htmlFor="configType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Template Configuration
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
      <ActionBox proxiesText={proxiesText} subs={subs} configType={configType} ghProxy={ghProxy} />

      {/* Modals */}
      <NodeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onInject={handleInjectNode} 
      />

    </main>
  );
}
