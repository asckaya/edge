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
    format: yaml
    behavior: domain
    url: "https://raw.githubusercontent.com/217heidai/adblockfilters/main/rules/adblockmihomo.yaml"
    path: ./ruleset/adblockfilters.yaml
    interval: 28800

  advertising:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ads-all.yaml"
    path: ./ruleset/advertising.yaml
    interval: 86400

  win-update:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/win-update.yaml"
    path: ./ruleset/win-update.yaml
    interval: 86400

  # 杀毒软件更新域名（建议直连）
  category-antivirus:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-antivirus.yaml"
    path: ./ruleset/category-antivirus.yaml
    interval: 86400

  # -- AI 服务 (DNS policy 需独立集，路由由 category 统一处理) --
  category-ai-chat-!cn:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ai-chat-!cn.yaml"
    path: ./ruleset/category-ai-chat-!cn.yaml
    interval: 86400

  xai:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/xai.yaml"
    path: ./ruleset/xai.yaml
    interval: 86400

  # AI 编辑器（cursor/windsurf/trae/manus 未必在 category-ai-chat-!cn 中）
  cursor:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/cursor.yaml"
    path: ./ruleset/cursor.yaml
    interval: 86400

  windsurf:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/windsurf.yaml"
    path: ./ruleset/windsurf.yaml
    interval: 86400

  trae:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/trae.yaml"
    path: ./ruleset/trae.yaml
    interval: 86400

  manus:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/manus.yaml"
    path: ./ruleset/manus.yaml
    interval: 86400

  jetbrains-ai:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/jetbrains-ai.yaml"
    path: ./ruleset/jetbrains-ai.yaml
    interval: 86400

  # -- 流媒体 --------------------------------------------------
  # youtube 独立集（不在 category-entertainment@!cn 中）
  youtube:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/youtube.yaml"
    path: ./ruleset/youtube.yaml
    interval: 86400

  # 主流流媒体平台（无聚合 category，独立集列出）
  netflix:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/netflix.yaml"
    path: ./ruleset/netflix.yaml
    interval: 86400

  disney:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/disney.yaml"
    path: ./ruleset/disney.yaml
    interval: 86400

  hbo:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/hbo.yaml"
    path: ./ruleset/hbo.yaml
    interval: 86400

  hulu:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/hulu.yaml"
    path: ./ruleset/hulu.yaml
    interval: 86400

  primevideo:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/primevideo.yaml"
    path: ./ruleset/primevideo.yaml
    interval: 86400

  # category-entertainment@!cn 主要覆盖 TikTok/WebNovel；netflix/spotify/twitch/biliintl 等境外娱乐
  category-entertainment@!cn:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-entertainment@!cn.yaml"
    path: ./ruleset/category-entertainment@!cn.yaml
    interval: 86400

  # -- 苹果服务 ------------------------------------------------
  apple:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/apple.yaml"
    path: ./ruleset/apple.yaml
    interval: 86400

  appletv:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/apple-tvplus.yaml"
    path: ./ruleset/appletv.yaml
    interval: 86400

  # -- 谷歌服务 ------------------------------------------------
  google:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/google.yaml"
    path: ./ruleset/google.yaml
    interval: 86400

  # -- 微软服务 ------------------------------------------------
  # microsoft 已包含 OneDrive / Office / Azure / Teams 等全部微软域名
  microsoft:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/microsoft.yaml"
    path: ./ruleset/microsoft.yaml
    interval: 86400

  # -- 开发工具 ------------------------------------------------
  # category-dev 含 github/npm/pypi/rubygems/crates.io 等
  category-dev:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-dev.yaml"
    path: ./ruleset/category-dev.yaml
    interval: 86400

  # category-container 覆盖 docker/quay 等容器仓库
  category-container:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-container.yaml"
    path: ./ruleset/category-container.yaml
    interval: 86400

  microsoft-dev:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/microsoft-dev.yaml"
    path: ./ruleset/microsoft-dev.yaml
    interval: 86400

  jetbrains:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/jetbrains.yaml"
    path: ./ruleset/jetbrains.yaml
    interval: 86400

  gitlab:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/gitlab.yaml"
    path: ./ruleset/gitlab.yaml
    interval: 86400

  # -- 即时通讯 & 社交 ------------------------------------------
  # category-communication 覆盖 telegram/discord/slack/protonmail/whatsapp 等
  category-communication:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-communication.yaml"
    path: ./ruleset/category-communication.yaml
    interval: 86400

  # category-voip 覆盖 zoom/webex/skype 等 (由 category-communication 互补)
  category-voip:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-voip.yaml"
    path: ./ruleset/category-voip.yaml
    interval: 86400

  # -- 社交媒体 ------------------------------------------------
  # category-social-media-!cn 覆盖 twitter/fb/ig/tiktok/discord/reddit 等
  category-social-media-!cn:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-social-media-!cn.yaml"
    path: ./ruleset/category-social-media-!cn.yaml
    interval: 86400

  # category-forums 覆盖 reddit/hackernews/discourse 等
  category-forums:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-forums.yaml"
    path: ./ruleset/category-forums.yaml
    interval: 86400

  # -- 游戏平台 ------------------------------------------------
  # category-games-!cn 仅境外游戏平台（更精确，避免误伤国内游戏）
  category-games-!cn:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-games-!cn.yaml"
    path: ./ruleset/category-games-!cn.yaml
    interval: 86400

  # category-game-platforms-download 包含 EA/Riot/Bethesda 等各大平台 CDN 下载域名
  category-game-platforms-download:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-game-platforms-download.yaml"
    path: ./ruleset/category-game-platforms-download.yaml
    interval: 86400

  # -- 教育资源 ------------------------------------------------
  category-scholar-!cn:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-scholar-!cn.yaml"
    path: ./ruleset/category-scholar-!cn.yaml
    interval: 86400

  # -- 生产力工具 -----------------------------------------------
  # category-remote-control 覆盖 TeamViewer/AnyDesk/RustDesk 等
  category-remote-control:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-remote-control.yaml"
    path: ./ruleset/category-remote-control.yaml
    interval: 86400

  # category-password-management 覆盖 1password/bitwarden/lastpass 等
  category-password-management:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-password-management.yaml"
    path: ./ruleset/category-password-management.yaml
    interval: 86400

  dropbox:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/dropbox.yaml"
    path: ./ruleset/dropbox.yaml
    interval: 86400

  mega:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/mega.yaml"
    path: ./ruleset/mega.yaml
    interval: 86400

  tutanota:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/tutanota.yaml"
    path: ./ruleset/tutanota.yaml
    interval: 86400

  # -- 云服务 --------------------------------------------------
  cloudflare:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/cloudflare.yaml"
    path: ./ruleset/cloudflare.yaml
    interval: 86400

  # -- 金融服务 ------------------------------------------------
  category-finance:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-finance.yaml"
    path: ./ruleset/category-finance.yaml
    interval: 86400

  # category-cryptocurrency 覆盖 coinbase/binance/okx 等
  category-cryptocurrency:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-cryptocurrency.yaml"
    path: ./ruleset/category-cryptocurrency.yaml
    interval: 86400

  paypal:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/paypal.yaml"
    path: ./ruleset/paypal.yaml
    interval: 86400

  # -- 新闻资讯 ------------------------------------------------
  category-news-ir:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-news-ir.yaml"
    path: ./ruleset/category-news-ir.yaml
    interval: 86400

  # category-tech-media 覆盖 techcrunch/verge/arstechnica/wired 等
  category-tech-media:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-tech-media.yaml"
    path: ./ruleset/category-tech-media.yaml
    interval: 86400

  # -- 成人内容 ------------------------------------------------
  category-porn:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-porn.yaml"
    path: ./ruleset/category-porn.yaml
    interval: 86400

  # -- BT / PT 追踪器 ------------------------------------------
  category-public-tracker:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-public-tracker.yaml"
    path: ./ruleset/category-public-tracker.yaml
    interval: 86400

  # category-pt: 私有 PT 站（M-Team/HDSky 等）
  category-pt:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-pt.yaml"
    path: ./ruleset/category-pt.yaml
    interval: 86400

  # -- 测速 ----------------------------------------------------
  # category-speedtest 覆盖 ookla/fast.com/nperf 等
  category-speedtest:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-speedtest.yaml"
    path: ./ruleset/category-speedtest.yaml
    interval: 86400

  # -- NTP 服务 ------------------------------------------------
  category-ntp:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ntp.yaml"
    path: ./ruleset/category-ntp.yaml
    interval: 86400

  # -- 地理数据 ------------------------------------------------
  private:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/private.yaml"
    path: ./ruleset/private.yaml
    interval: 86400

  private-ip:
    type: http
    format: yaml
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/private.yaml"
    path: ./ruleset/private-ip.yaml
    interval: 86400

  geolocation-cn:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/geolocation-cn.yaml"
    path: ./ruleset/geolocation-cn.yaml
    interval: 86400

  geolocation-!cn:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/geolocation-!cn.yaml"
    path: ./ruleset/geolocation-!cn.yaml
    interval: 86400

  cn:
    type: http
    format: yaml
    behavior: domain
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/cn.yaml"
    path: ./ruleset/cn.yaml
    interval: 86400

  # GeoIP 国内 IP 段（ipcidr）——解决 CN 应用直接用 IP 连接绕过域名规则的问题
  # 腾讯会议等 App 的媒体流量直接连国内 IP（中国移动/联通等），需要此规则兜底直连
  cn-ip:
    type: http
    format: yaml
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/cn.yaml"
    path: ./ruleset/cn-ip.yaml
    interval: 86400

  # Telegram DC 服务器 IP（Telegram 媒体传输直接走 IP，域名规则覆盖不到）
  telegram-ip:
    type: http
    format: yaml
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/telegram.yaml"
    path: ./ruleset/telegram-ip.yaml
    interval: 86400

  # Netflix CDN IP 段（流媒体解锁节点，域名规则覆盖不到的直连 IP）
  netflix-ip:
    type: http
    format: yaml
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/netflix.yaml"
    path: ./ruleset/netflix-ip.yaml
    interval: 86400

  # Google IP 段（部分 Google 服务直接用 IP 连接）
  google-ip:
    type: http
    format: yaml
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/google.yaml"
    path: ./ruleset/google-ip.yaml
    interval: 86400

  # Twitter/X IP 段
  twitter-ip:
    type: http
    format: yaml
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/twitter.yaml"
    path: ./ruleset/twitter-ip.yaml
    interval: 86400

  # Cloudflare IP 段（补充域名规则之外的直接 IP 流量）
  cloudflare-ip:
    type: http
    format: yaml
    behavior: ipcidr
    url: "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/cloudflare.yaml"
    path: ./ruleset/cloudflare-ip.yaml
    interval: 86400
`;
