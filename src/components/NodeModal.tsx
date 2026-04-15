'use client';
import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInject: (nodeStr: string) => void;
}

export default function NodeModal({ isOpen, onClose, onInject }: Props) {
  const [protocol, setProtocol] = useState('vless');
  
  // Generic Fields
  const [host, setHost] = useState('');
  const [port, setPort] = useState('443');
  const [name, setName] = useState('');
  
  // Auth Fields
  const [uuid, setUuid] = useState('');
  const [password, setPassword] = useState('');
  
  // Advanced Fields
  const [sni, setSni] = useState('');
  const [network, setNetwork] = useState('tcp');
  
  // Protocol specific
  const [encryption, setEncryption] = useState('none');
  const [security, setSecurity] = useState('tls');
  const [cipher, setCipher] = useState('aes-256-gcm');
  const [alpn, setAlpn] = useState('h3');
  const [congestion, setCongestion] = useState('bbr');
  const [obfs, setObfs] = useState('none');
  const [obfsPassword, setObfsPassword] = useState('');
  
  // Wireguard
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [localIp, setLocalIp] = useState('10.0.0.1/24');
  const [mtu, setMtu] = useState('1420');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setProtocol('vless');
      setHost('');
      setPort('443');
      setName('');
      setUuid('');
      setPassword('');
      setSni('');
      setNetwork('tcp');
      setEncryption('none');
      setSecurity('tls');
      setCipher('aes-256-gcm');
      setAlpn('h3');
      setCongestion('bbr');
      setObfs('none');
      setObfsPassword('');
      setPrivateKey('');
      setPublicKey('');
      setLocalIp('10.0.0.1/24');
      setMtu('1420');
    }
  }, [isOpen]);

  // Reset protocol-specific fields when protocol changes
  useEffect(() => {
    // Keep host, port, and name. Reset the rest
    setUuid('');
    setPassword('');
    setSni('');
    setEncryption('none');
    setAlpn('h3');
    setCongestion('bbr');
    setObfs('none');
    setObfsPassword('');
    setPrivateKey('');
    setPublicKey('');
    setLocalIp('10.0.0.1/24');
    setMtu('1420');
    setCipher('aes-256-gcm');

    if (protocol === 'vless' || protocol === 'vmess' || protocol === 'trojan') {
      setSecurity('tls');
      setNetwork('tcp');
    } else if (protocol === 'hysteria2' || protocol === 'tuic') {
      setSecurity('tls'); // using 'none' for insecure in h2
    } else if (protocol === 'wireguard' || protocol === 'ss') {
      setSecurity('none');
      setNetwork('tcp');
    }
  }, [protocol]);

  if (!isOpen) return null;

  const handleInject = () => {
    if (!host || !port) {
      alert("Host and Port are required.");
      return;
    }

    let uri = '';
    const encodedName = name ? `#${encodeURIComponent(name)}` : '';
    const searchParams = new URLSearchParams();

    switch (protocol) {
      case 'vless':
      case 'vmess':
      case 'trojan':
        uri = `${protocol}://${uuid || password}@${host}:${port}`;
        if (protocol === 'vless' && encryption) searchParams.set('encryption', encryption);
        if (security && security !== 'none') searchParams.set('security', security);
        if (sni) searchParams.set('sni', sni);
        if (network && network !== 'tcp') {
            searchParams.set('type', network);
            // Just a basic example for path
            if (network === 'ws') searchParams.set('path', '/');
        }
        break;
      case 'hysteria2':
        uri = `hysteria2://${password}@${host}:${port}`;
        if (sni) searchParams.set('sni', sni);
        if (security === 'none') searchParams.set('insecure', '1');
        if (obfs && obfs !== 'none') {
            searchParams.set('obfs', obfs);
            searchParams.set('obfs-password', obfsPassword);
        }
        break;
      case 'tuic':
        uri = `tuic://${uuid}:${password}@${host}:${port}`;
        if (sni) searchParams.set('sni', sni);
        if (alpn) searchParams.set('alpn', alpn);
        if (congestion) searchParams.set('congestion_control', congestion);
        break;
      case 'ss':
        // UserInfo = base64(cipher:password)
        const userInfo = btoa(`${cipher}:${password}`);
        uri = `ss://${userInfo}@${host}:${port}`;
        break;
      case 'wireguard':
        uri = `wireguard://${privateKey}@${host}:${port}`;
        if (publicKey) searchParams.set('public-key', publicKey);
        if (localIp) searchParams.set('ip', localIp);
        if (mtu) searchParams.set('mtu', mtu);
        break;
      default:
        return;
    }

    const qs = searchParams.toString();
    const finalUri = qs ? `${uri}?${qs}${encodedName}` : `${uri}${encodedName}`;
    
    // Inject and close
    onInject(finalUri);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadein">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl animate-scalein overflow-hidden border border-gray-200 dark:border-slate-600 flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Node Form Builder
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Protocol</label>
            <select 
              value={protocol} 
              onChange={(e) => setProtocol(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
            >
              <option value="vless">VLESS</option>
              <option value="vmess">VMess</option>
              <option value="trojan">Trojan</option>
              <option value="hysteria2">Hysteria2</option>
              <option value="tuic">TUIC v5</option>
              <option value="ss">Shadowsocks</option>
              <option value="wireguard">WireGuard</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Host / Server IP</label>
              <input type="text" value={host} onChange={e => setHost(e.target.value)} placeholder="example.com" className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Port</label>
              <input type="number" value={port} onChange={e => setPort(e.target.value)} placeholder="443" className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Remarks (Node Name)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="My Demo Node" className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none" />
            </div>
          </div>

          {/* Dynamic Fields based on protocol */}
          <div className="p-4 bg-gray-50 dark:bg-slate-800/30 rounded-xl border border-gray-100 dark:border-slate-700 space-y-4">
            
            {(protocol === 'vless' || protocol === 'vmess' || protocol === 'tuic') && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">UUID</label>
                <input type="text" value={uuid} onChange={e => setUuid(e.target.value)} placeholder="b831381d-6324-4d53-ad4f-8cda48b30811" className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none font-mono" />
              </div>
            )}

            {(protocol === 'trojan' || protocol === 'hysteria2' || protocol === 'tuic' || protocol === 'ss') && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Password</label>
                <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="your_secret_password" className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none" />
              </div>
            )}

            {(protocol === 'ss') && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Cipher</label>
                <select value={cipher} onChange={e => setCipher(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none">
                  <option value="aes-128-gcm">aes-128-gcm</option>
                  <option value="aes-256-gcm">aes-256-gcm</option>
                  <option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</option>
                </select>
              </div>
            )}

            {(protocol === 'vless' || protocol === 'vmess' || protocol === 'trojan' || protocol === 'hysteria2' || protocol === 'tuic') && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">SNI (Server Name Indication)</label>
                <input type="text" value={sni} onChange={e => setSni(e.target.value)} placeholder="yahoo.com" className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none" />
              </div>
            )}

            {(protocol === 'wireguard') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Private Key</label>
                  <input type="text" value={privateKey} onChange={e => setPrivateKey(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Peer Public Key</label>
                  <input type="text" value={publicKey} onChange={e => setPublicKey(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Local IP</label>
                    <input type="text" value={localIp} onChange={e => setLocalIp(e.target.value)} placeholder="10.0.0.1/24" className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">MTU</label>
                    <input type="number" value={mtu} onChange={e => setMtu(e.target.value)} placeholder="1420" className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none" />
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
        
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleInject} className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
            Build & Inject
          </button>
        </div>
      </div>
    </div>
  );
}
