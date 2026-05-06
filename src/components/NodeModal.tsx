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
      setSecurity('tls'); 
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
    onInject(finalUri);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="apple-card w-full max-w-xl relative flex flex-col max-h-[90vh] animate-scale-in">
        
        <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight">Build Custom Node</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(0,0,0,0.1)] dark:hover:bg-[rgba(255,255,255,0.2)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          <div className="space-y-4">
            <label className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Network</label>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">Protocol</label>
                <select 
                  value={protocol} 
                  onChange={(e) => setProtocol(e.target.value)}
                  className="w-full apple-input appearance-none"
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

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8 space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">Server Address</label>
                  <input type="text" value={host} onChange={e => setHost(e.target.value)} placeholder="example.com" className="w-full apple-input font-mono text-sm" />
                </div>
                <div className="col-span-4 space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">Port</label>
                  <input type="number" value={port} onChange={e => setPort(e.target.value)} placeholder="443" className="w-full apple-input font-mono text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">Remarks (Optional)</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="My Demo Node" className="w-full apple-input" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Authentication</label>
            <div className="grid grid-cols-1 gap-4 p-5 bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] rounded-[14px] border border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)]">
              
              {(protocol === 'vless' || protocol === 'vmess' || protocol === 'tuic') && (
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">UUID</label>
                  <input type="text" value={uuid} onChange={e => setUuid(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className="w-full apple-input font-mono text-[13px]" />
                </div>
              )}

              {(protocol === 'trojan' || protocol === 'hysteria2' || protocol === 'tuic' || protocol === 'ss') && (
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">Password</label>
                  <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" className="w-full apple-input font-mono text-[13px]" />
                </div>
              )}

              {(protocol === 'ss') && (
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">Cipher</label>
                  <select value={cipher} onChange={e => setCipher(e.target.value)} className="w-full apple-input appearance-none">
                    <option value="aes-128-gcm">aes-128-gcm</option>
                    <option value="aes-256-gcm">aes-256-gcm</option>
                    <option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</option>
                  </select>
                </div>
              )}

              {(protocol === 'vless' || protocol === 'vmess' || protocol === 'trojan' || protocol === 'hysteria2' || protocol === 'tuic') && (
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">SNI</label>
                  <input type="text" value={sni} onChange={e => setSni(e.target.value)} placeholder="example.com" className="w-full apple-input font-mono text-[13px]" />
                </div>
              )}

              {(protocol === 'wireguard') && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">Private Key</label>
                    <input type="text" value={privateKey} onChange={e => setPrivateKey(e.target.value)} className="w-full apple-input font-mono text-[13px]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">Peer Public Key</label>
                    <input type="text" value={publicKey} onChange={e => setPublicKey(e.target.value)} className="w-full apple-input font-mono text-[13px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">Local IP</label>
                      <input type="text" value={localIp} onChange={e => setLocalIp(e.target.value)} placeholder="10.0.0.1/24" className="w-full apple-input font-mono text-[13px]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400 px-1">MTU</label>
                      <input type="number" value={mtu} onChange={e => setMtu(e.target.value)} placeholder="1420" className="w-full apple-input font-mono text-[13px]" />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
        
        <div className="px-6 py-5 border-t border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] flex justify-end gap-3 shrink-0 rounded-b-[20px]">
          <button onClick={onClose} className="apple-btn apple-btn-secondary">Cancel</button>
          <button onClick={handleInject} className="apple-btn apple-btn-primary px-6">Build Node</button>
        </div>
      </div>
    </div>
  );
}
