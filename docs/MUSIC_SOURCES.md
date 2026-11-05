# 音乐目录来源

核对日期：2026-11-05。曲序、曲名与封面以憨厚的厂牌官方发行页为准；封面版权归原权利人所有，不代表本站作品或本人照片。

| 专辑 | 曲目 | 官方发行页 | 本地封面（640px WebP） |
| --- | --- | --- | --- |
| 一抹憨色 | 10 首，含序曲与尾声 | https://www.dizzylab.net/d/515/ | `public/content/uploads/e5a14515-b5b8-42fd-96a2-1d22f20d0536.webp` |
| 二次元凶 | 4 首 Mini EP | https://www.dizzylab.net/d/255/ | `public/content/uploads/fc823ca5-6993-4d6c-a163-59af2015b97a.webp` |

两张封面分别来自发行页公开展示的 `https://cdn.dizzylab.net/media/cover/515.jpg` 与 `https://cdn.dizzylab.net/media/cover/255.jpg`，等比压缩，无重绘和裁切。页面显示来源链接及版权说明。

一专歌曲 ID 由网易云公开检索结果逐首核对，限定专辑 ID `151855481`、艺术家 ID `1049179`，保留原有《它像一颗》ID `1982799628`。

后续按用户要求，二专改为 [QQ 音乐官方专辑](https://y.qq.com/n/ryqq_v2/albumDetail/003PDOea18kOjf)，专辑 MID `003PDOea18kOjf`、歌手 MID `000c2vQb13oq5I`。数字 ID 与 MID 经 QQ 音乐公开检索结果及官方专辑页核对；每首链接使用 `https://i.y.qq.com/v8/playsong.html?songid=数字ID`，由 QQ 音乐跳转歌曲详情页。官方外链播放器为 `https://i.y.qq.com/n2/m/outchain/player/index.html?songid=数字ID&songtype=0`，仅在点击后加载，不提取音频。

| 曲序 | 歌曲 | QQ 数字 ID | 歌曲 MID |
| --- | --- | --- | --- |
| 1 | 二次元凶 | 610333693 | 0015IeIl3kBP3P |
| 2 | 中古店爱情 | 610333608 | 000ZPQ0x3SaOAe |
| 3 | 冲动是小天使 | 610333565 | 003QDT632qXoLY |
| 4 | 那太重了 | 610333603 | 002eOrPB0EbprL |

hanser 官方试听 PV：[一抹憨色](https://www.bilibili.com/video/BV1Ct4y1b7oi/)、[二次元凶](https://www.bilibili.com/video/BV1qLtuz3EXx/)。不下载或分发歌曲音频、歌词本和曲绘特典。

首轮紧凑目录验证：`npm test` 34 项通过，`npm run build` 通过；Chromium 在 1440、768、375、320px 宽度下无横向溢出和歌曲标题/操作重叠，14 张封面实例均成功加载且保持正方形。初次打开未加载第三方资源或播放器，点击《它像一颗》后生成对应 ID、`auto=0` 的官方 iframe。网易云 iframe 在本机 HTTP 预览产生第三方传感器权限/跨域脚本报错，未验证实际音频播放；未测试真实手机、其他浏览器或屏幕阅读器。

后续折叠专辑与 QQ 播放器验证：`npm test` 36 项、`npm run build` 通过。Chromium 验证两张专辑默认收起、鼠标及 Enter/空格展开收起，展开后分别显示 10/4 首；桌面仍是 230px 正方形封面及右侧纵向播放入口，1440/768/375/320px 无横向溢出。初次进入无 iframe 或第三方请求。二专官方 iframe 实际显示“二次元凶 - hanser”，收起专辑、收起面板及换到 World 后保留同一 iframe，停止后卸载；一专《它像一颗》仍加载对应网易云地址。编辑器预览保持专辑展开，QQ 链接自动识别 ID、清除其他平台 ID、撤销恢复均通过，验证未写回测试内容。未进行音频实听、真实手机、跨浏览器或屏幕阅读器验证；完整收听由 QQ 音乐的登录和专辑购买权限决定。
