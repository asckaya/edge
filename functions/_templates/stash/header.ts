// Stash iOS header configuration
// Omits: tun (managed by Stash app), external-controller, external-ui,
//        geodata-mode, geox-url, find-process-mode, global-client-fingerprint.

export const configStashHeader = `ipv6: false
log-level: info
mixed-port: 7897
allow-lan: true
unified-delay: true
tcp-concurrent: true
`;
