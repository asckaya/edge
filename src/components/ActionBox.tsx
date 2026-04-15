'use client';
import React, { useState } from 'react';
import type { Subscription } from './SubscriptionPanel';

interface ActionBoxProps {
  proxiesText: string;
  subs: Subscription[];
  configType: string;
  ghProxy?: string;
}

export default function ActionBox({ proxiesText, subs, configType, ghProxy }: ActionBoxProps) {
  const [resultUrl, setResultUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Validation Logic
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
    <>
      <button 
        onClick={generateUrl}
        disabled={!isValid}
        className={`w-full py-4.5 font-bold rounded-2xl transition-all transform flex items-center justify-center gap-2 shadow-xl ${
          isValid 
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white active:scale-[0.98] shadow-blue-500/25' 
            : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed border border-gray-200 dark:border-slate-700'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        {isValid ? 'Build Configuration API' : 'Please fix errors to build'}
      </button>

      {resultUrl && (
        <div className="mt-10 p-7 bg-blue-50/50 dark:bg-blue-500/5 rounded-[1.5rem] border border-blue-100 dark:border-blue-500/20 animate-fadein relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
          
          <label className="block text-sm font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Generated API Subscription URL
          </label>
          
          <div className="break-all font-mono text-sm text-gray-700 dark:text-blue-100 mb-6 p-5 bg-white/60 dark:bg-black/40 rounded-xl select-all border border-blue-100/50 dark:border-blue-400/10 backdrop-blur-sm shadow-inner group-hover:border-blue-300 dark:group-hover:border-blue-400/30 transition-colors">
            {resultUrl}
          </div>
          
          <button 
            onClick={copyUrl}
            className={`w-full py-4 px-6 font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md ${
              copied 
                ? 'bg-green-500 text-white shadow-green-500/20' 
                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm'
            }`}
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied Successfully</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
