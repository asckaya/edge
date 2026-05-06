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
    <div className="space-y-6">
      <button 
        onClick={generateUrl}
        disabled={!isValid}
        className={`w-full apple-btn py-4 text-[15px] flex items-center justify-center gap-2 ${
          isValid 
            ? 'apple-btn-primary shadow-md shadow-blue-500/20' 
            : 'bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }`}
      >
        {isValid ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        )}
        {isValid ? 'Generate Configuration' : 'Complete Setup to Generate'}
      </button>

      {resultUrl && (
        <div className="p-5 bg-[rgba(0,113,227,0.04)] dark:bg-[rgba(10,132,255,0.08)] rounded-[20px] border border-[rgba(0,113,227,0.1)] dark:border-[rgba(10,132,255,0.15)] flex flex-col gap-4 animate-scale-in">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#0071e3] dark:text-[#0a84ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <div className="text-[15px] font-semibold text-[#0071e3] dark:text-[#0a84ff]">Subscription URL Ready</div>
          </div>
          
          <div className="break-all font-mono text-[13px] text-gray-700 dark:text-gray-300 p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)]">
            {resultUrl}
          </div>
          
          <button 
            onClick={copyUrl}
            className={`apple-btn w-full py-3 ${
              copied 
                ? 'bg-[#34c759] text-white shadow-md shadow-green-500/20' 
                : 'apple-btn-secondary border border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] shadow-sm'
            }`}
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Copied to Clipboard
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy URL
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
