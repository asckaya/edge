'use client';
import { useState } from 'react';
import SubscriptionPanel, { Subscription } from '@/components/SubscriptionPanel';
import NodeModal from '@/components/NodeModal';
import ActionBox from '@/components/ActionBox';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proxiesText, setProxiesText] = useState('');
  const [subs, setSubs] = useState<Subscription[]>(() => [{ id: Date.now(), name: '', url: '' }]);
  const [configType, setConfigType] = useState('mihomo');
  const [secret, setSecret] = useState('edge-default');
  const [ghProxy, setGhProxy] = useState('');

  const handleInjectNode = (uri: string) => {
    setProxiesText(prev => prev ? prev + '\n' + uri : uri);
  };

  const COMMON_GH_PROXIES = [
    'https://gh-proxy.com/',
    'https://mirror.ghproxy.com/',
    'https://ghproxy.net/',
    'https://gh-proxy.org/',
  ];

  const CONFIG_GROUPS = [
    {
      label: 'Mihomo / Clash Meta',
      options: [
        { value: 'mihomo', label: 'Mihomo Full' },
        { value: 'mihomo-mini', label: 'Mihomo Mini (Whitelist)' },
        { value: 'mihomo-micro', label: 'Mihomo Micro (Blacklist)' },
      ]
    },
    {
      label: 'Stash iOS',
      options: [
        { value: 'stash', label: 'Stash Full' },
        { value: 'stash-mini', label: 'Stash Mini (Whitelist)' },
        { value: 'stash-micro', label: 'Stash Micro (Blacklist)' },
      ]
    },
    {
      label: 'sing-box',
      options: [
        { value: 'sing-box', label: 'sing-box Full' },
        { value: 'sing-box-mini', label: 'sing-box Mini (Whitelist)' },
        { value: 'sing-box-micro', label: 'sing-box Micro (Blacklist)' },
      ]
    }
  ];

  return (
    <div className="relative min-h-screen py-12 px-4 flex items-center justify-center overflow-hidden">
      
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <main className="w-full max-w-2xl glass-panel p-8 sm:p-12 relative z-10 mx-auto animate-reveal">
        
        {/* Header */}
        <header className="mb-12 text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto mb-8 group">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative w-full h-full bg-[#111] rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gradient">
            Edge Engine
          </h1>
          <p className="text-[16px] text-white/40 font-medium max-w-md mx-auto leading-relaxed">
            Universal subscription orchestrator for Mihomo, Stash, and sing-box environments.
          </p>
        </header>

        <div className="space-y-10">
          
          {/* Proxies Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="label-caps">
                Raw Proxies
              </label>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-[12px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
              >
                + Inject Node
              </button>
            </div>
            <textarea 
              id="proxies-textarea"
              value={proxiesText}
              onChange={(e) => setProxiesText(e.target.value)}
              placeholder="vless://...&#10;vmess://..."
              spellCheck="false"
              className="w-full min-h-[140px] modern-input font-mono text-[13px] resize-y"
            />
          </section>

          {/* Subscriptions Section */}
          <section className="space-y-4">
            <div className="px-1">
              <label className="label-caps">
                Remote Providers
              </label>
            </div>
            <SubscriptionPanel subs={subs} setSubs={setSubs} />
          </section>

          {/* Configuration Section */}
          <section className="space-y-4">
            <div className="px-1">
              <label className="label-caps">
                Orchestration Settings
              </label>
            </div>
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.05]">
              <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-4 hover:bg-white/[0.01] transition-colors">
                <span className="text-[14px] font-semibold text-white/70 w-32 shrink-0">Kernel Type</span>
                <div className="relative w-full">
                  <select 
                    value={configType}
                    onChange={(e) => setConfigType(e.target.value)}
                    className="w-full bg-transparent text-[15px] font-medium focus:outline-none appearance-none cursor-pointer text-white"
                  >
                    {CONFIG_GROUPS.map(group => (
                      <optgroup key={group.label} label={group.label} className="bg-[#111] text-white/50">
                        {group.options.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-[#111] text-white">
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-4 hover:bg-white/[0.01] transition-colors">
                <span className="text-[14px] font-semibold text-white/70 w-32 shrink-0">Controller Secret</span>
                <input 
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Mihomo / sing-box password"
                  className="w-full bg-transparent text-[15px] focus:outline-none font-mono text-white placeholder:text-white/20"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-4 hover:bg-white/[0.01] transition-colors">
                <span className="text-[14px] font-semibold text-white/70 w-32 shrink-0">Mirror Path</span>
                <input 
                  list="gh-proxies-list"
                  type="text"
                  value={ghProxy}
                  onChange={(e) => setGhProxy(e.target.value)}
                  placeholder="Direct (Default)"
                  className="w-full bg-transparent text-[15px] focus:outline-none font-mono text-white placeholder:text-white/20"
                />
                <datalist id="gh-proxies-list">
                  {COMMON_GH_PROXIES.map(proxy => (
                    <option key={proxy} value={proxy} />
                  ))}
                </datalist>
              </div>
            </div>
          </section>

          <div className="pt-6">
            <ActionBox proxiesText={proxiesText} subs={subs} configType={configType} ghProxy={ghProxy} secret={secret} />
          </div>

        </div>

        <footer className="mt-16 text-center border-t border-white/[0.05] pt-8">
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
            Distributed Edge Deployment &bull; Cloudflare Core
          </p>
        </footer>

      </main>

      {isModalOpen && (
        <NodeModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onInject={handleInjectNode} 
        />
      )}
    </div>
  );
}
