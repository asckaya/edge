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
  };

  const COMMON_GH_PROXIES = [
    'https://gh-proxy.com/',
    'https://mirror.ghproxy.com/',
    'https://ghproxy.net/',
    'https://gh-proxy.org/',
  ];

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center animate-fade-in">
      <main className="w-full max-w-2xl apple-card p-8 sm:p-10 relative z-10 mx-auto">
        
        {/* Header */}
        <header className="mb-10 text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-[#0071e3] to-[#409cff] rounded-[22px] shadow-lg flex items-center justify-center mb-6 shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Edge Subscription</h1>
          <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400">
            Convert Mihomo, Stash, and sing-box profiles instantly.
          </p>
        </header>

        <div className="space-y-8">
          
          {/* Settings Group */}
          <div className="space-y-6">
            
            {/* Proxies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Self-Hosted Proxies
                </label>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-[13px] font-medium text-[#0071e3] hover:text-[#0077ED] transition-colors"
                >
                  Add Node
                </button>
              </div>
              <textarea 
                id="proxies-textarea"
                value={proxiesText}
                onChange={(e) => setProxiesText(e.target.value)}
                placeholder="vless://...&#10;vmess://..."
                spellCheck="false"
                className="w-full min-h-[120px] apple-input font-mono text-[13px] resize-y"
              />
            </div>

            {/* Subscriptions */}
            <div className="space-y-3">
              <div className="px-1">
                <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Subscriptions
                </label>
              </div>
              <SubscriptionPanel subs={subs} setSubs={setSubs} />
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3">
              <div className="px-1">
                <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Configuration Options
                </label>
              </div>
              <div className="bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.04)] rounded-[14px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] p-4 gap-4">
                  <span className="text-[15px] font-medium w-32 shrink-0">Template</span>
                  <select 
                    value={configType}
                    onChange={(e) => setConfigType(e.target.value)}
                    className="w-full bg-transparent text-[15px] font-medium focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="mihomo">Mihomo / Clash Meta</option>
                    <option value="stash">Stash iOS (Full)</option>
                    <option value="stash-mini">Stash iOS (Mini)</option>
                    <option value="sing-box">sing-box 1.13+ (JSON)</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center p-4 gap-4">
                  <span className="text-[15px] font-medium w-32 shrink-0">GitHub Proxy</span>
                  <input 
                    list="gh-proxies-list"
                    type="text"
                    value={ghProxy}
                    onChange={(e) => setGhProxy(e.target.value)}
                    placeholder="None (Default)"
                    className="w-full bg-transparent text-[15px] focus:outline-none font-mono"
                  />
                  <datalist id="gh-proxies-list">
                    {COMMON_GH_PROXIES.map(proxy => (
                      <option key={proxy} value={proxy} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-4">
            <ActionBox proxiesText={proxiesText} subs={subs} configType={configType} ghProxy={ghProxy} />
          </div>

        </div>

        <footer className="mt-10 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Cloudflare Pages &bull; Edge Workers
          </p>
        </footer>

      </main>

      <NodeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onInject={handleInjectNode} 
      />
    </div>
  );
}
