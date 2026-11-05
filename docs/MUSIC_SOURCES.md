# 音乐目录来源

核对日期：2026-11-05。曲序、曲名与封面以憨厚的厂牌官方发行页为准；封面版权归原权利人所有，不代表本站作品或本人照片。

| 专辑 | 曲目 | 官方发行页 | 本地封面（640px WebP） |
| --- | --- | --- | --- |
| 一抹憨色 | 10 首，含序曲与尾声 | https://www.dizzylab.net/d/515/ | `public/content/uploads/e5a14515-b5b8-42fd-96a2-1d22f20d0536.webp` |
| 二次元凶 | 4 首 Mini EP | https://www.dizzylab.net/d/255/ | `public/content/uploads/fc823ca5-6993-4d6c-a163-59af2015b97a.webp` |

两张封面分别来自发行页公开展示的 `https://cdn.dizzylab.net/media/cover/515.jpg` 与 `https://cdn.dizzylab.net/media/cover/255.jpg`，等比压缩，无重绘和裁切。页面显示来源链接及版权说明。

一专歌曲 ID 由网易云公开检索结果逐首核对，限定专辑 ID `151855481`、艺术家 ID `1049179`，保留原有《它像一颗》ID `1982799628`。二专仅提供厂牌官方试听页，不添加未经核实的网易云歌曲 ID。

hanser 官方试听 PV：[一抹憨色](https://www.bilibili.com/video/BV1Ct4y1b7oi/)、[二次元凶](https://www.bilibili.com/video/BV1qLtuz3EXx/)。不下载或分发歌曲音频、歌词本和曲绘特典。

本轮验证：`npm test` 34 项通过，`npm run build` 通过；Chromium 在 1440、768、375、320px 宽度下无横向溢出和歌曲标题/操作重叠，14 张封面实例均成功加载且保持正方形。初次打开未加载第三方资源或播放器，点击《它像一颗》后生成对应 ID、`auto=0` 的官方 iframe。网易云 iframe 在本机 HTTP 预览产生第三方传感器权限/跨域脚本报错，未验证实际音频播放；未测试真实手机、其他浏览器或屏幕阅读器。
