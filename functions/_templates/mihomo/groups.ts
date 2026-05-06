// Mihomo proxy-groups template
// Node chain uses dialer-proxy (relay type was deprecated in Mihomo 1.19+).

export const configMihomoGroupsHeader = `proxy-groups:
  - name: 🚀 节点选择
    type: select
    proxies: [DIRECT, REJECT, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, {{AUTO_GROUPS_LIST}}, {{PROVIDERS_LIST}}, {{SELF_HOSTED_GROUP}}]

  - name: ♻️ 自动选择
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🇭🇰 香港节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: '(?i)(🇭🇰|港|\\bHK(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|hk|Hong Kong|HongKong|hongkong|HONG KONG|HONGKONG|深港|HKG|九龙|Kowloon|新界|沙田|荃湾|葵涌)'

  - name: 🇺🇸 美国节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: '(?i)(🇺🇸|美|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|纽约|纽纽|亚特兰大|迈阿密|华盛顿|\\bUS(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|United States|UnitedStates|UNITED STATES|USA|America|AMERICA|JFK|EWR|IAD|ATL|ORD|MIA|NYC|LAX|SFO|SEA|DFW|SJC)'

  - name: 🇯🇵 日本节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: '(?i)(🇯🇵|日本|川日|东京|大阪|泉日|埼玉|沪日|深日|(?<!尼|-)日|\\bJP(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Japan|JAPAN|JPN|NRT|HND|KIX|TYO|OSA|关西|Kansai|KANSAI)'

  - name: 🇸🇬 新加坡节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: '(?i)(🇸🇬|新加坡|坡|狮城|\\bSG(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Singapore|SINGAPORE|SIN)'

  - name: 🇼🇸 台湾节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: '(?i)(🇹🇼|🇼🇸|台|新北|彰化|\\bTW(?:[-_ ]?\\d+(?:[-_ ]?[A-Za-z]{2,})?)?\\b|Taiwan|TAIWAN|TWN|TPE|ROC)'
`;



export const configMihomoGroupsMid = `  - name: 🛑 广告拦截
    type: select
    proxies: [REJECT, DIRECT, 🚀 节点选择, {{AUTO_GROUPS_LIST}}]

  - name: 💬 AI 服务
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 📹 油管视频
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🔍 谷歌服务
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🏠 私有网络
    type: select
    proxies: [DIRECT, REJECT, 🚀 节点选择, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🔒 国内服务
    type: select
    proxies: [DIRECT, REJECT, 🚀 节点选择, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 📲 电报消息
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🐱 开发工具
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: Ⓜ️ 微软服务
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🍏 苹果服务
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🎬 苹果视频
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🌐 社交媒体
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🎬 流媒体
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🎮 游戏平台
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🎮 游戏下载
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 📚 教育资源
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🛠️ 生产力工具
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 💰 金融服务
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 📰 新闻资讯
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🔞 成人内容
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🧲 BT/PT
    type: select
    proxies: [DIRECT, 🚀 节点选择, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: ☁️ 云服务
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🌐 非中国
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🐟 漏网之鱼
    type: select
    proxies: [🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇺🇸 美国节点, 🇯🇵 日本节点, 🇸🇬 新加坡节点, 🇼🇸 台湾节点, DIRECT, REJECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]
    filter: "^(?!.*(DIRECT|直接连接|群|邀请|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|无法|说明|使用|提示|特别|访问|支持|教程|关注|更新|作者|加入|USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Traffic|GB|Expire)).*$"

  - name: 🧪 测速专线
    type: select
    proxies: [🚀 节点选择, DIRECT, {{AUTO_GROUPS_LIST}}]
    include-all-proxies: true
    use: [{{PROVIDERS_LIST}}]

  - name: 🕓 NTP 服务
    type: select
    proxies: [DIRECT, 🚀 节点选择]
`;
