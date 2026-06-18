# 问心阁

> 不问鬼神，只问本心。

一个新中式「静心小站」：问签、命盘、今日历、梦释、心灯、静坐。
纯静态网站 —— 无构建步骤、无框架依赖、无后端，整个文件夹即是全部源码与部署产物。

## 本地预览

双击 `index.html` 即可打开；或起一个本地服务（推荐，体验与线上一致）：

```bash
cd 问心阁
python3 -m http.server 8000
# 浏览器访问 http://localhost:8000
```

## 部署上线（Cloudflare Pages）

1. 打开 https://dash.cloudflare.com → Workers & Pages → Create → Pages → **Upload assets**；
2. 把本文件夹整个拖进去，点 Deploy，完成。
   （也可推到 GitHub 后连仓库自动部署；无需任何构建命令，输出目录填 `/`。）

## 目录结构

```
问心阁/
├── index.html        首页（仪盘式入口、每日一语、心光概览、每日一省签到）
├── qian.html         问签 —— 36 支原创「问心签」，每日免费 3 次
├── ming.html         命盘 —— 公历/农历排四柱八字、十神、五行与大运初读
├── today.html        今日 —— 农历/干支/宜忌/十二时辰（CDN 历法库，失败自动降级）
├── meng.html         梦释 —— 原创词库 ~46 条，搜索 + 分类
├── deng.html         心灯 —— 为牵挂的人点灯，本地灯墙
├── xi.html           静坐 —— 呼吸引导 + Web Audio 合成磬声 + 计时
├── me.html           我的 —— 雅号、心光值、记录、会员预留、清空数据
├── css/style.css     设计系统 v3「玄曜仪盘」（墨黑底 × 铜线星图 × 赤印 × 青玉状态色）
├── js/core.js        本地用户体系（雅号）、心光值、签到、导航注入、Toast/弹窗、星图背景/涟漪/滚动浮现动效
├── js/premium.js     ★ 收费版块预留接口（见下）
├── js/bazi.js        命盘模块（基于 lunar-javascript 整理八字、十神、五行、大运）
├── js/lunar.js       第三方历法库 lunar-javascript v1.7.3（MIT）
├── js/data.js        全部内容数据（签文、梦库、灯种、语录，均为原创可改）
├── favicon.svg / manifest.json
└── README.md
```

## ★ 收费版块如何启用

所有付费点都汇聚在 `js/premium.js` 一个文件里，页面侧统一通过
`Premium.require(productId, fn)` 调用 —— 已解锁（或限免期）直接执行，否则弹收银台。

当前 `FREE_MODE = true`（限免模式），全部免费放行并展示「限免」徽标。

正式收费时：

1. `js/premium.js` 中把 `FREE_MODE` 改为 `false`；
2. 实现 `openCheckout()` 中的 TODO：调后端 `POST /api/v1/payment/create`
   创建订单 → 打开收银台 → 轮询 `GET /api/v1/payment/status` → 成功后 `grant()`；
3. 实现启动时拉取已购权益（`GET /api/v1/entitlement/status`），写入本地缓存；
4. 用户身份可沿用现有「雅号」机制对接后端匿名账号。

现有收费点（产品目录见 `premium.js` 顶部）：

| productId    | 位置           | 内容                 |
|--------------|----------------|----------------------|
| `deep_qian`  | 问签结果页     | 签文逐句深解         |
| `deep_meng`  | 梦释结果页     | 梦境深释             |
| `deep_bazi`  | 命盘结果页     | 命局深读             |
| `extra_qian` | 问签每日3次用完 | 加签一次            |
| `lamp_long`  | 心灯灯种       | 长明灯（置顶常驻）   |
| `member`     | 我的页         | 问心会员             |

## 数据与隐私

所有用户数据（雅号、心光、灯墙、历史）仅存于浏览器 localStorage，
本站不收集、不上传任何个人信息。「我的 → 清空全部记录」可一键删除。

## 内容版权与合规

- 36 支签文、梦释词条、每日一语均为本站原创撰写，可自由修改；
- 「今日」与「命盘」页历法/八字数据来自开源库 [lunar-javascript](https://github.com/6tail/lunar-javascript)（MIT 协议，本地引入）；
- 全站页脚常驻免责声明：内容仅作传统文化与心境调适参考，不构成医疗、法律、投资等专业建议。
