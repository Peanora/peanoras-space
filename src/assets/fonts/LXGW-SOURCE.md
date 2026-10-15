# LXGW WenKai Lite 网页字体

- 来源：[官方仓库](https://github.com/lxgw/LxgwWenKai-Lite)，`fonts/TTF/LXGWWenKaiLite-Regular.ttf`。
- 上游版本：`Version 1.530; October 13, 2026`，获取日期 2026-10-15。
- 上游 TTF SHA-256：`9737d7efe43e6a49ede3c563fe4d436f763db9be1e403a37b9613c2ab30e8cfb`。
- `LXGWWenKaiLite-Regular.woff2`：完整网页字库，25,694 个字符，5,305,748 字节。
- `LXGWWenKaiLite-Core.woff2`：当前源码文字的小字库，476 个字符，94,412 字节。
- 用 FontTools 转换/提取，仅用于网页字体分发，不提供桌面安装版。保留原始字形和字体内部命名；CSS 家族名是网页使用的别名。
- `LXGW-WenKai-Lite-OFL.txt` 包含 OFL 1.1 及作者对网页格式转换、子集化的附加许可，构建时也分发到 `licenses/`。
- 生成方式见 `scripts/prepare-wenkai.py`。新增签名文字无需重新生成：CSS 优先使用小包，未覆盖字自动加载完整包。
