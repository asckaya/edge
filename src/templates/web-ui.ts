const webUIHtml = `<!DOCTYPE html>
<html lang="en" class="dark:bg-slate-900">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edge Subscription Generator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'media',
            theme: {
                extend: {
                    colors: {
                        primary: '#3b82f6',
                        primaryHover: '#2563eb',
                        bgDark: '#0f172a',
                        surfaceDark: '#1e293b',
                        borderDark: '#334155',
                        textMainDark: '#f8fafc',
                        textMutedDark: '#94a3b8',
                        bgLight: '#f8fafc',
                        surfaceLight: '#ffffff',
                        borderLight: '#e2e8f0',
                        textMainLight: '#0f172a',
                        textMutedLight: '#64748b'
                    }
                }
            }
        }
    </script>
    <style>
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.3s; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-gray-100 min-h-screen flex items-center justify-center p-6 antialiased selection:bg-blue-500/30">

    <div class="w-full max-w-2xl bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 animate-slideUp">
        <h1 class="text-3xl font-extrabold mb-2 bg-gradient-to-br from-blue-600 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight">
            Edge Subscription
        </h1>
        <p class="text-gray-500 dark:text-slate-400 mb-8 text-sm sm:text-base">
            Convert your proxy URI links into Cloudflare Worker configs
        </p>

        <div class="mb-6 space-y-2">
            <label for="proxies" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Proxy Links (vless://, hysteria2://, tuic://, etc.)
            </label>
            <textarea id="proxies" 
                placeholder="Paste your proxy uris here separated by newline..." 
                spellcheck="false"
                class="w-full min-h-[140px] p-4 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono resize-y"></textarea>
        </div>

        <div class="mb-8 space-y-2">
            <label for="configType" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Template Type
            </label>
            <select id="configType" class="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer appearance-none">
                <option value="mihomo">Mihomo / Clash Meta</option>
                <option value="stash">Stash iOS (Full Rules)</option>
                <option value="stash-mini">Stash iOS Mini (Low memory &lt;50MB)</option>
            </select>
        </div>

        <button onclick="generateUrl()" 
            class="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/30">
            Generate Subscription
        </button>

        <!-- Result Box -->
        <div id="result-box" class="mt-8 p-6 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 animate-fadeIn hidden">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Your Subscription URL
            </label>
            <div id="result-url" class="break-all font-mono text-xs sm:text-sm text-gray-500 dark:text-slate-400 mb-4 p-4 bg-gray-200/50 dark:bg-black/20 rounded-lg select-all"></div>
            
            <button id="copy-btn" onclick="copyUrl()" 
                class="w-full py-2.5 px-4 bg-transparent border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/-svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to Clipboard
            </button>
        </div>
    </div>

    <script>
        function generateUrl() {
            const rawProxies = document.getElementById('proxies').value.trim();
            const type = document.getElementById('configType').value;
            
            if (!rawProxies) {
                alert('Please enter at least one proxy link!');
                return;
            }

            const url = new URL(window.location.origin);
            url.searchParams.set('type', type);
            const proxiesParam = rawProxies.split('\\n').map(l => l.trim()).filter(Boolean).join('\\n');
            url.searchParams.set('proxies', proxiesParam);
            
            document.getElementById('result-url').textContent = url.toString();
            document.getElementById('result-box').classList.remove('hidden');
            
            const copyBtn = document.getElementById('copy-btn');
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy to Clipboard';
            copyBtn.className = "w-full py-2.5 px-4 bg-transparent border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 font-medium rounded-lg transition-colors flex items-center justify-center gap-2";
        }

        function copyUrl() {
            const textToCopy = document.getElementById('result-url').textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const btn = document.getElementById('copy-btn');
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg> Copied!';
                btn.className = "w-full py-2.5 px-4 bg-green-500 text-white border-transparent font-medium rounded-lg transition-colors shadow-lg shadow-green-500/30 flex items-center justify-center gap-2";
                
                setTimeout(() => {
                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy to Clipboard';
                    btn.className = "w-full py-2.5 px-4 bg-transparent border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 font-medium rounded-lg transition-colors flex items-center justify-center gap-2";
                }, 2000);
            }).catch(err => console.error('Failed to copy: ', err));
        }
    </script>
</body>
</html>`;

export default webUIHtml;
