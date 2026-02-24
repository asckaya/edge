'use client';
import { useState } from 'react';
import type { Subscription } from './SubscriptionPanel';

interface Props {
  proxiesText: string;
  subs: Subscription[];
  configType: string;
}

export default function ActionBox({ proxiesText, subs, configType }: Props) {
  const [resultUrl, setResultUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const generateUrl = () => {
    // Generate URL based on inputs
    const url = new URL(window.location.origin);
    url.searchParams.set('type', configType);
    
    let hasSub = false;
    subs.forEach(sub => {
      const name = sub.name.trim();
      const sUrl = sub.url.trim();
      if (name && sUrl) {
        url.searchParams.set(name, sUrl);
        hasSub = true;
      }
    });

    const rawProxies = proxiesText.trim();
    if (!rawProxies && !hasSub) {
      alert('Please provide at least a self-hosted proxy URI or an external subscription.');
      return;
    }

    if(rawProxies) {
      const proxiesParam = rawProxies.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
      url.searchParams.set('proxies', proxiesParam);
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
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        Build Configuration API
      </button>

      {resultUrl && (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 animate-fadein">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Your API Subscription URL
          </label>
          <div className="break-all font-mono text-xs sm:text-sm text-gray-600 dark:text-slate-400 mb-4 p-4 bg-gray-200/50 dark:bg-black/20 rounded-lg select-all border border-gray-200 dark:border-slate-700/50">
            {resultUrl}
          </div>
          
          <button 
            onClick={copyUrl}
            className={`w-full py-3 px-4 font-medium rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
              copied 
                ? 'bg-green-500 text-white border-transparent shadow-lg shadow-green-500/30' 
                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 dark:hover:border-slate-500'
            }`}
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
