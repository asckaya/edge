// Shared rule-providers definition (used by both Mihomo and Stash)
// All providers verified against local meta-rules-dat (MetaCubeX/meta-rules-dat@meta branch).
//
// Design principles:
// 1. Prefer category-* sets over individual providers when they cover the same scope.
// 2. Keep individual providers only when they need distinct routing from their category,
//    or for DNS nameserver-policy precision (Mihomo only).
// 3. Individual AI providers (openai/anthropic/etc.) are kept for Mihomo DNS nameserver-policy.

export const configRuleProviders = `rule-providers:
  # -- 隐私 & 广告拦截 -----------------------------------------
  adblockfilters:
    type: http
    format: mrs
    behavior: domain
    url: "https://raw.githubusercontent.com/217heidai/adblockfilters/main/rules/adblockmihomo.mrs"
    path: ./ruleset/adblockfilters.mrs
    interval: 28800

  advertising:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ads-all.mrs"
    path: ./ruleset/advertising.mrs
    interval: 86400

  win-update:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/win-update.mrs"
    path: ./ruleset/win-update.mrs
    interval: 86400

  # 杀毒软件更新域名（建议直连）
  category-antivirus:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-antivirus.mrs"
    path: ./ruleset/category-antivirus.mrs
    interval: 86400

  # -- AI 服务 (DNS policy 需独立集，路由由 category 统一处理) --
  category-ai-chat-!cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ai-chat-!cn.mrs"
    path: ./ruleset/category-ai-chat-!cn.mrs
    interval: 86400

  xai:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/xai.mrs"
    path: ./ruleset/xai.mrs
    interval: 86400

  # AI 编辑器（cursor/windsurf/trae/manus 未必在 category-ai-chat-!cn 中）
  cursor:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/cursor.mrs"
    path: ./ruleset/cursor.mrs
    interval: 86400

  windsurf:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/windsurf.mrs"
    path: ./ruleset/windsurf.mrs
    interval: 86400

  trae:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/trae.mrs"
    path: ./ruleset/trae.mrs
    interval: 86400

  manus:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/manus.mrs"
    path: ./ruleset/manus.mrs
    interval: 86400

  jetbrains-ai:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/jetbrains-ai.mrs"
    path: ./ruleset/jetbrains-ai.mrs
    interval: 86400

  # -- 流媒体 --------------------------------------------------
  # youtube 独立集（不在 category-entertainment@!cn 中）
  youtube:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/youtube.mrs"
    path: ./ruleset/youtube.mrs
    interval: 86400

  # 主流流媒体平台（无聚合 category，独立集列出）
  netflix:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/netflix.mrs"
    path: ./ruleset/netflix.mrs
    interval: 86400

  disney:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/disney.mrs"
    path: ./ruleset/disney.mrs
    interval: 86400

  hbo:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/hbo.mrs"
    path: ./ruleset/hbo.mrs
    interval: 86400

  hulu:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/hulu.mrs"
    path: ./ruleset/hulu.mrs
    interval: 86400

  primevideo:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/primevideo.mrs"
    path: ./ruleset/primevideo.mrs
    interval: 86400

  # category-entertainment@!cn 主要覆盖 TikTok/WebNovel；netflix/spotify/twitch/biliintl 等境外娱乐
  category-entertainment@!cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-entertainment@!cn.mrs"
    path: ./ruleset/category-entertainment@!cn.mrs
    interval: 86400

  # -- 苹果服务 ------------------------------------------------
  apple:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/apple.mrs"
    path: ./ruleset/apple.mrs
    interval: 86400

  appletv:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/apple-tvplus.mrs"
    path: ./ruleset/appletv.mrs
    interval: 86400

  # -- 谷歌服务 ------------------------------------------------
  google:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/google.mrs"
    path: ./ruleset/google.mrs
    interval: 86400

  # -- 微软服务 ------------------------------------------------
  # microsoft 已包含 OneDrive / Office / Azure / Teams 等全部微软域名
  microsoft:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/microsoft.mrs"
    path: ./ruleset/microsoft.mrs
    interval: 86400

  # -- 开发工具 ------------------------------------------------
  # category-dev 含 github/npm/pypi/rubygems/crates.io 等
  category-dev:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-dev.mrs"
    path: ./ruleset/category-dev.mrs
    interval: 86400

  # category-container 覆盖 docker/quay 等容器仓库
  category-container:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-container.mrs"
    path: ./ruleset/category-container.mrs
    interval: 86400

  microsoft-dev:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/microsoft-dev.mrs"
    path: ./ruleset/microsoft-dev.mrs
    interval: 86400

  jetbrains:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/jetbrains.mrs"
    path: ./ruleset/jetbrains.mrs
    interval: 86400

  gitlab:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/gitlab.mrs"
    path: ./ruleset/gitlab.mrs
    interval: 86400

  # -- 即时通讯 & 社交 ------------------------------------------
  # category-communication 覆盖 telegram/discord/slack/protonmail/whatsapp 等
  category-communication:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-communication.mrs"
    path: ./ruleset/category-communication.mrs
    interval: 86400

  # category-voip 覆盖 zoom/webex/skype 等 (由 category-communication 互补)
  category-voip:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-voip.mrs"
    path: ./ruleset/category-voip.mrs
    interval: 86400

  # -- 社交媒体 ------------------------------------------------
  # category-social-media-!cn 覆盖 twitter/fb/ig/tiktok/discord/reddit 等
  category-social-media-!cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-social-media-!cn.mrs"
    path: ./ruleset/category-social-media-!cn.mrs
    interval: 86400

  # category-forums 覆盖 reddit/hackernews/discourse 等
  category-forums:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-forums.mrs"
    path: ./ruleset/category-forums.mrs
    interval: 86400

  # -- 游戏平台 ------------------------------------------------
  # category-games-!cn 仅境外游戏平台（更精确，避免误伤国内游戏）
  category-games-!cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-games-!cn.mrs"
    path: ./ruleset/category-games-!cn.mrs
    interval: 86400

  # category-game-platforms-download 包含 EA/Riot/Bethesda 等各大平台 CDN 下载域名
  category-game-platforms-download:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-game-platforms-download.mrs"
    path: ./ruleset/category-game-platforms-download.mrs
    interval: 86400

  # -- 教育资源 ------------------------------------------------
  category-scholar-!cn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-scholar-!cn.mrs"
    path: ./ruleset/category-scholar-!cn.mrs
    interval: 86400

  # -- 生产力工具 -----------------------------------------------
  # category-remote-control 覆盖 TeamViewer/AnyDesk/RustDesk 等
  category-remote-control:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-remote-control.mrs"
    path: ./ruleset/category-remote-control.mrs
    interval: 86400

  # category-password-management 覆盖 1password/bitwarden/lastpass 等
  category-password-management:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-password-management.mrs"
    path: ./ruleset/category-password-management.mrs
    interval: 86400

  dropbox:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/dropbox.mrs"
    path: ./ruleset/dropbox.mrs
    interval: 86400

  mega:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/mega.mrs"
    path: ./ruleset/mega.mrs
    interval: 86400

  tutanota:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/tutanota.mrs"
    path: ./ruleset/tutanota.mrs
    interval: 86400

  # -- 云服务 --------------------------------------------------
  cloudflare:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/cloudflare.mrs"
    path: ./ruleset/cloudflare.mrs
    interval: 86400

  # -- 金融服务 ------------------------------------------------
  category-finance:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-finance.mrs"
    path: ./ruleset/category-finance.mrs
    interval: 86400

  # category-cryptocurrency 覆盖 coinbase/binance/okx 等
  category-cryptocurrency:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-cryptocurrency.mrs"
    path: ./ruleset/category-cryptocurrency.mrs
    interval: 86400

  paypal:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/paypal.mrs"
    path: ./ruleset/paypal.mrs
    interval: 86400

  # -- 新闻资讯 ------------------------------------------------
  category-news-ir:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-news-ir.mrs"
    path: ./ruleset/category-news-ir.mrs
    interval: 86400

  # category-tech-media 覆盖 techcrunch/verge/arstechnica/wired 等
  category-tech-media:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-tech-media.mrs"
    path: ./ruleset/category-tech-media.mrs
    interval: 86400

  # -- 成人内容 ------------------------------------------------
  category-porn:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-porn.mrs"
    path: ./ruleset/category-porn.mrs
    interval: 86400

  # -- BT / PT 追踪器 ------------------------------------------
  category-public-tracker:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-public-tracker.mrs"
    path: ./ruleset/category-public-tracker.mrs
    interval: 86400

  # category-pt: 私有 PT 站（M-Team/HDSky 等）
  category-pt:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-pt.mrs"
    path: ./ruleset/category-pt.mrs
    interval: 86400

  # -- 测速 ----------------------------------------------------
  # category-speedtest 覆盖 ookla/fast.com/nperf 等
  category-speedtest:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-speedtest.mrs"
    path: ./ruleset/category-speedtest.mrs
    interval: 86400

  # -- NTP 服务 ------------------------------------------------
  category-ntp:
    type: http
    format: mrs
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ntp.mrs"
    path: ./ruleset/category-ntp.mrs
    interval: 86400

  # -- 地理数据 ------------------------------------------------
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

  # GeoIP 国内 IP 段（ipcidr）——解决 CN 应用直接用 IP 连接绕过域名规则的问题
  # 腾讯会议等 App 的媒体流量直接连国内 IP（中国移动/联通等），需要此规则兜底直连
  cn-ip:
    type: http
    format: mrs
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/cn.mrs"
    path: ./ruleset/cn-ip.mrs
    interval: 86400

  # Telegram DC 服务器 IP（Telegram 媒体传输直接走 IP，域名规则覆盖不到）
  telegram-ip:
    type: http
    format: mrs
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/telegram.mrs"
    path: ./ruleset/telegram-ip.mrs
    interval: 86400

  # Netflix CDN IP 段（流媒体解锁节点，域名规则覆盖不到的直连 IP）
  netflix-ip:
    type: http
    format: mrs
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/netflix.mrs"
    path: ./ruleset/netflix-ip.mrs
    interval: 86400

  # Google IP 段（部分 Google 服务直接用 IP 连接）
  google-ip:
    type: http
    format: mrs
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/google.mrs"
    path: ./ruleset/google-ip.mrs
    interval: 86400

  # Twitter/X IP 段
  twitter-ip:
    type: http
    format: mrs
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/twitter.mrs"
    path: ./ruleset/twitter-ip.mrs
    interval: 86400

  # Cloudflare IP 段（补充域名规则之外的直接 IP 流量）
  cloudflare-ip:
    type: http
    format: mrs
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/cloudflare.mrs"
    path: ./ruleset/cloudflare-ip.mrs
    interval: 86400
`;
