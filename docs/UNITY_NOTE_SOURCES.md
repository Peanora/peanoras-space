# Unity 笔记来源与分类

整理日期：2026-11-07。来源为用户本机 `E:/珍贵资料/unity学习笔记`，按用户提供的思维导图排列。共发布 20 篇：沿用 3 篇，新增 17 篇。网站继续使用原有笔记目录、分类筛选和阅读页，不增设重复内容源。

分类筛选使用导图主分类，子主题在下表对应；环境搭建、界面基础、反射机制、脚本基本规则等没有对应独立源文件的分支不补写。场景/光标/随机数/委托属于导图之外的补充 API；模型导入与项目打包含资源、Prefab 与构建补充。

| 源文件 | 主分类 | 导图主题 | 固定网址 ID |
| --- | --- | --- | --- |
| `模型导入与项目打包.md` | Unity工作原理 | 预设体和资源包的导入导出（含构建补充） | `unity-model-import-build` |
| `生命周期函数.md` | Unity脚本基础 | 生命周期函数 | `unity-lifecycle` |
| `Inspector窗口可编辑的变量.md` | Unity脚本基础 | Inspector窗口可编辑的变量 | `unity-inspector-variables` |
| `MonoBehaviour中的重要内容.md` | Unity脚本基础 | Mono中的重要内容 | `unity-monobehaviour` |
| `GameObject.md` | Unity重要组件和Api | 最小单位Gameobject | `unity-gameobject` |
| `Time时间.md` | Unity重要组件和Api | 时间相关Time | `unity-time` |
| `Vector3与位置位移.md` | Unity重要组件和Api | 必不可少Transform | `unity-vector3-position` |
| `角度旋转缩放与看向.md` | Unity重要组件和Api | 必不可少Transform | `unity-transform-rotation-scale` |
| `Transform父子关系.md` | Unity重要组件和Api | 必不可少Transform | `unity-transform-parenting` |
| `Transform坐标转换.md` | Unity重要组件和Api | 必不可少Transform | `unity-transform-space` |
| `Input输入.md` | Unity重要组件和Api | Input和Screen | `unity-input` |
| `Screen屏幕.md` | Unity重要组件和Api | Input和Screen | `unity-screen` |
| `Camera摄像机.md` | Unity重要组件和Api | 必不可少Camera | `unity-camera` |
| `场景光标随机数与委托.md` | Unity重要组件和Api | 补充API | `unity-scene-cursor-random-action` |
| `光源与环境光照.md` | 核心系统 | 核心系统—光源系统基础 | `unity-lighting` |
| `刚体与碰撞器.md` | 核心系统 | 核心系统—物理系统之碰撞检测 | `unity-rigidbody-colliders` |
| `碰撞与触发回调.md` | 核心系统 | 核心系统—物理系统之碰撞检测 | `unity-collision-trigger` |
| `刚体加力.md` | 核心系统 | 核心系统—物理系统之碰撞检测 | `unity-rigidbody-forces` |
| `音频导入与播放.md` | 核心系统 | 核心系统—音效系统 | `unity-audio` |
| `麦克风录音.md` | 核心系统 | 核心系统—音效系统 | `unity-microphone` |

## 排除范围

三篇 `坦克实战一 界面与数据.md`、`坦克实战二 玩家武器与奖励.md`、`坦克实战三 敌人血条与结算.md` 不导入正文或代码，也不放入源码草稿。`00 入门笔记目录.md` 是内部课次索引与练习规划，含实战链接，不独立发布，以网站目录代替。非实战笔记中的普通练习与示例保留。

## 内容保留

原有生命周期、Inspector 变量、MonoBehaviour 三篇的章节对象与导入前逐字段一致，网址及锚点不变。新增 17 篇按相对标题层级将 H4/H5 映射为 H2/H3，多段代码前后的说明保持原顺序。20 篇共 61 段围栏代码逐段比较一致；新增正文去除 Markdown 格式后，与生成 HTML 解码文字一致，链接逐项保留。没有图片或 LaTeX 需要迁移。ForceMode 的三列表格与 `F×Δt/m` 等公式保留为静态表格，属性继续净化。

新条目摘要取自原稿主标题，不编造学习日期，原始文件保持不动。原稿 Input 篇为新输入系统，Camera 篇仍包含旧 `Input.mousePosition`，本次作为内容导入保留原文；未进行 Unity 编译、执行或设备验证。

## 验证

- `npm test` 37 项通过；`npm run build` 生成全部 20 篇静态入口。
- Chromium 逐篇直达 20 篇文章，DOM 中的正文、代码指纹与内容源一致，标题级别及所有目录锚点匹配；源文件与导入结果另经独立只读审查。
- 四个分类筛选结果为 1/3/10/6，搜索正常；目录、GameObject、Input、刚体加力在 1440/375/320px 宽度检查无页面横向溢出。
- ForceMode 三列表格、四种模式和公式完整显示；窄屏表格可独立横向滚动。富文本实际验证保留表格，移除脚本、图片、事件/样式属性和 `javascript:` 链接，代码中的 `<Keyboard>/w` 保持文本。
- 未测试真实手机、其他浏览器及屏幕阅读器；本次网页显示验证不代表 Unity 示例已编译或实机验证。
