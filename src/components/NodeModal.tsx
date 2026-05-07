'use client';
import { useState } from 'react';

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

  const handleProtocolChange = (val: string) => {
    setProtocol(val);
    
    // Reset fields on protocol change
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

    if (val === 'vless' || val === 'vmess' || val === 'trojan') {
      setSecurity('tls');
      setNetwork('tcp');
    } else if (val === 'hysteria2' || val === 'tuic') {
      setSecurity('tls'); 
    } else if (val === 'wireguard' || val === 'ss') {
      setSecurity('none');
      setNetwork('tcp');
    }
  };

  if (!isOpen) return null;

  const handleInject = () => {
    if (!host || !port) {
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
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="glass-panel w-full max-w-xl relative flex flex-col max-h-[90vh] animate-reveal">
        
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            <h3 className="text-[18px] font-bold text-white tracking-tight uppercase">Forge Custom Endpoint</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10">
          
          <div className="space-y-6">
            <label className="label-caps px-1">Network Topology</label>
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">Protocol Variant</label>
                <div className="relative">
                  <select 
                    value={protocol} 
                    onChange={(e) => handleProtocolChange(e.target.value)}
                    className="w-full modern-input appearance-none bg-[#111] text-white"
                  >
                    <option value="vless">VLESS (Modern)</option>
                    <option value="vmess">VMess (Legacy)</option>
                    <option value="trojan">Trojan (Secure)</option>
                    <option value="hysteria2">Hysteria2 (UDP)</option>
                    <option value="tuic">TUIC v5 (QUIC)</option>
                    <option value="ss">Shadowsocks (Lite)</option>
                    <option value="wireguard">WireGuard (Native)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-8 space-y-2">
                  <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">Uplink Address</label>
                  <input type="text" value={host} onChange={e => setHost(e.target.value)} placeholder="0.0.0.0" className="w-full modern-input font-mono text-sm placeholder:text-white/5" />
                </div>
                <div className="col-span-4 space-y-2">
                  <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">Port</label>
                  <input type="number" value={port} onChange={e => setPort(e.target.value)} placeholder="443" className="w-full modern-input font-mono text-sm placeholder:text-white/5" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">Identifier (Optional)</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Primary-Node-Alpha" className="w-full modern-input placeholder:text-white/5" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <label className="label-caps px-1">Authorization Layer</label>
            <div className="grid grid-cols-1 gap-5 p-6 bg-white/[0.02] rounded-2xl border border-white/5">
              
              {(protocol === 'vless' || protocol === 'vmess' || protocol === 'tuic') && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">UUID Hash</label>
                  <input type="text" value={uuid} onChange={e => setUuid(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className="w-full modern-input font-mono text-[12px] placeholder:text-white/5" />
                </div>
              )}

              {(protocol === 'trojan' || protocol === 'hysteria2' || protocol === 'tuic' || protocol === 'ss') && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">Security Token</label>
                  <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" className="w-full modern-input font-mono text-[12px] placeholder:text-white/5" />
                </div>
              )}

              {protocol === 'ss' && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">Cipher Suite</label>
                  <div className="relative">
                    <select value={cipher} onChange={e => setCipher(e.target.value)} className="w-full modern-input appearance-none bg-[#111]">
                      <option value="aes-128-gcm">aes-128-gcm</option>
                      <option value="aes-256-gcm">aes-256-gcm</option>
                      <option value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              )}

              {(protocol === 'vless' || protocol === 'vmess' || protocol === 'trojan' || protocol === 'hysteria2' || protocol === 'tuic') && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">TLS SNI Domain</label>
                  <input type="text" value={sni} onChange={e => setSni(e.target.value)} placeholder="edge.example.com" className="w-full modern-input font-mono text-[12px] placeholder:text-white/5" />
                </div>
              )}

              {protocol === 'wireguard' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">Internal Secret Key</label>
                    <input type="text" value={privateKey} onChange={e => setPrivateKey(e.target.value)} className="w-full modern-input font-mono text-[12px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">External Peer Key</label>
                    <input type="text" value={publicKey} onChange={e => setPublicKey(e.target.value)} className="w-full modern-input font-mono text-[12px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">Tunnel CIDR</label>
                      <input type="text" value={localIp} onChange={e => setLocalIp(e.target.value)} placeholder="10.0.0.1/24" className="w-full modern-input font-mono text-[12px]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-white/40 uppercase tracking-widest px-1">MTU</label>
                      <input type="number" value={mtu} onChange={e => setMtu(e.target.value)} placeholder="1420" className="w-full modern-input font-mono text-[12px]" />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
        
        <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex justify-end gap-4 shrink-0">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] text-white/40 hover:text-white transition-colors">Cancel Operation</button>
          <button onClick={handleInject} className="btn-glow !py-3 !px-8 text-[11px] uppercase tracking-widest">Finalize Node</button>
        </div>
      </div>
    </div>
  );
}

