'use client';
import React, { useState } from 'react';
import type { Subscription } from './SubscriptionPanel';

interface ActionBoxProps {
  proxiesText: string;
  subs: Subscription[];
  configType: string;
  ghProxy?: string;
  secret: string;
}

export default function ActionBox({ proxiesText, subs, configType, ghProxy, secret }: ActionBoxProps) {
  const [resultUrl, setResultUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const isSafeName = (name: string) => /^[a-zA-Z0-9_\u4e00-\u9fa5]*$/.test(name);
  const isUrl = (url: string) => url === '' || /^https?:\/\/.+/.test(url);
  
  const names = subs.map(s => s.name.trim()).filter(n => n !== '');
  const hasDuplicateNames = names.some((name, index) => names.indexOf(name) !== index);
  
  const allNamesSafe = subs.every(s => isSafeName(s.name.trim()));
  const allUrlsValid = subs.every(s => isUrl(s.url.trim()));
  
  const isAtLeastOneProvided = proxiesText.trim() !== '' || subs.some(s => s.name.trim() !== '' && s.url.trim() !== '');

  const isValid = isAtLeastOneProvided && allNamesSafe && allUrlsValid && !hasDuplicateNames;

  const generateUrl = () => {
    const url = new URL(window.location.origin);
    url.searchParams.set('type', configType);
    url.searchParams.set('secret', secret);
    
    subs.forEach(sub => {
      const name = sub.name.trim();
      const sUrl = sub.url.trim();
      if (name && sUrl) {
        url.searchParams.set(name, sUrl);
      }
    });

    const rawProxies = proxiesText.trim();
    if (rawProxies) {
      const proxiesParam = rawProxies.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
      url.searchParams.set('proxies', proxiesParam);
    }
    
    if (ghProxy?.trim()) {
      url.searchParams.set('gh_proxy', ghProxy.trim());
    }

    setResultUrl(url.toString());
    setCopied(false);
  };


  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="space-y-8">
      <button 
        onClick={generateUrl}
        disabled={!isValid}
        className={`w-full py-5 text-[15px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${
          isValid 
            ? 'btn-glow' 
            : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed rounded-2xl'
        }`}
      >
        {isValid ? (
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Deploy Configuration
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Awaiting Parameters
          </div>
        )}
      </button>

      {resultUrl && (
        <div className="p-6 bg-blue-500/[0.03] rounded-3xl border border-blue-500/10 flex flex-col gap-5 animate-reveal backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <div className="text-[13px] font-bold uppercase tracking-[0.2em] text-blue-400">Endpoint Manifested</div>
          </div>
          
          <div className="relative group">
            <div className="break-all font-mono text-[11px] text-white/50 p-5 bg-black/40 rounded-2xl border border-white/5 group-hover:border-blue-500/20 transition-colors leading-relaxed">
              {resultUrl}
            </div>
          </div>
          
          <button 
            onClick={copyUrl}
            className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[12px] transition-all duration-500 flex items-center justify-center gap-2 ${
              copied 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Synchronized
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Clone URI
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

