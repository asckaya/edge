// Stash iOS Mini rule-providers
// Reduced from 42 → 15 providers to keep Network Extension memory < 50MB.
//
// Removed vs shared/rule-providers.ts:
//   - win-spy / win-extra / win-update  (iOS doesn't run Windows processes)
//   - category-httpdns-cn / category-doh  (handled via DNS config directly)
//   - openai / anthropic / google-gemini / deepseek / perplexity / xai
//     (covered by category-ai-chat-!cn; individual sets only needed for
//      Mihomo nameserver-policy which Stash handles via geosite: syntax)
//   - cursor / windsurf / trae / manus / jetbrains-ai  (AI editors; not used on iOS)
//   - category-container / microsoft-dev / jetbrains / gitlab
//     (all hit by category-dev or geolocation-!cn fallback)
//   - category-forums  (subset of category-social-media-!cn)
//   - appletv          (merged into apple ruleset on iOS)
//   - onedrive         (merged into microsoft)
//   - category-password-management / slack / dropbox / mega / protonmail / tutanota
//     (all hit geolocation-!cn → proxy; no need for dedicated groups on iOS)
//   - category-finance / category-cryptocurrency / paypal  (geolocation-!cn covers them)
//   - category-tech-media / category-news-ir  (geolocation-!cn covers them)
//   - category-porn              (App Store already filters adult content)
//   - category-public-tracker / category-pt  (BT/PT uncommon on iOS)
//   - category-speedtest / category-ntp  (not needed on iOS)
//   - cn               (geolocation-cn already covers the same space)

export const configStashMiniRuleProviders = `rule-providers:
  # -- 广告拦截 ------------------------------------------------
  advertising:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ads-all.mrs"
    path: ./ruleset/advertising.mrs
    interval: 86400

  # -- AI 服务 ------------------------------------------------
  # category-ai-chat-!cn 覆盖 openai/anthropic/gemini/deepseek/perplexity/xai 等
  category-ai-chat-!cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ai-chat-!cn.mrs"
    path: ./ruleset/category-ai-chat-!cn.mrs
    interval: 86400

  # -- 流媒体 -------------------------------------------------
  # youtube 独立集（不在 category-entertainment@!cn 的 .mrs 中）
  youtube:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/youtube.mrs"
    path: ./ruleset/youtube.mrs
    interval: 86400

  # category-entertainment@!cn 主要覆盖 TikTok/WebNovel；netflix/spotify/twitch/biliintl 等
  category-entertainment@!cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-entertainment@!cn.mrs"
    path: ./ruleset/category-entertainment@!cn.mrs
    interval: 86400

  # -- 即时通讯 -----------------------------------------------
  # category-voip 覆盖 telegram/signal/whatsapp/line/zoom 等
  category-voip:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-voip.mrs"
    path: ./ruleset/category-voip.mrs
    interval: 86400

  # -- 社交媒体 -----------------------------------------------
  # category-social-media-!cn 覆盖 twitter/fb/ig/tiktok/discord/reddit 等
  category-social-media-!cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-social-media-!cn.mrs"
    path: ./ruleset/category-social-media-!cn.mrs
    interval: 86400

  # -- 苹果服务 -----------------------------------------------
  # apple 包含 App Store / iCloud / Apple TV+ 等全部苹果域名
  apple:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/apple.mrs"
    path: ./ruleset/apple.mrs
    interval: 86400

  # -- 谷歌服务 -----------------------------------------------
  google:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/google.mrs"
    path: ./ruleset/google.mrs
    interval: 86400

  # -- 微软服务 -----------------------------------------------
  # microsoft 含 OneDrive / Office / Azure 等
  microsoft:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/microsoft.mrs"
    path: ./ruleset/microsoft.mrs
    interval: 86400

  # -- 开发工具 -----------------------------------------------
  # category-dev 含 github/npm/pypi/rubygems/crates.io 等
  category-dev:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-dev.mrs"
    path: ./ruleset/category-dev.mrs
    interval: 86400

  # -- 游戏平台 -----------------------------------------------
  # category-games-!cn 仅境外游戏（避免误伤国内游戏）
  category-games-!cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-games-!cn.mrs"
    path: ./ruleset/category-games-!cn.mrs
    interval: 86400

  # -- 云服务 -------------------------------------------------
  cloudflare:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/cloudflare.mrs"
    path: ./ruleset/cloudflare.mrs
    interval: 86400

  # -- 地理数据 -----------------------------------------------
  private:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/private.mrs"
    path: ./ruleset/private.mrs
    interval: 86400

  private-ip:
    type: http
    format: mrs
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/private.mrs"
    path: ./ruleset/private-ip.mrs
    interval: 86400

  geolocation-cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/geolocation-cn.mrs"
    path: ./ruleset/geolocation-cn.mrs
    interval: 86400

  geolocation-!cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/geolocation-!cn.mrs"
    path: ./ruleset/geolocation-!cn.mrs
    interval: 86400

  cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/cn.mrs"
    path: ./ruleset/cn.mrs
    interval: 86400

  # GeoIP 国内 IP 段（ipcidr）——解决 CN App 直连 IP 绕过域名规则的问题
  # 腾讯会议等 App 媒体流量直接连国内 IP，此规则兜底直连
  cn-ip:
    type: http
    format: mrs
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/cn.mrs"
    path: ./ruleset/cn-ip.mrs
    interval: 86400
`;
