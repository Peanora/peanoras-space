import projectImage from "../assets/artwork/web/spring-garden.webp";
import memoryImage from "../assets/artwork/web/flower-stage.webp";

export const site = {
  name: "Peanora's Space",
  nickname: "Peanora",
  welcome: "欢迎来到我的小空间",
  // 继续往数组里添加签名，首页会依次打字、停留、删除并循环。
  signatures: ["好好睡觉，好好吃饭，好好上班，好好上学~"],
  socials: [{ label: "GitHub", url: "https://github.com/Citlali37" }],
  navigation: [
    { label: "My World", path: "/world" },
    { label: "Music & Memories", path: "/music" },
    { label: "Little Things", path: "/little-things" },
  ],
  themes: [
    {
      number: "01",
      title: "My World",
      subtitle: "我的个人世界",
      index: "About / Projects / Experience",
      path: "/world",
      action: "进入个人世界",
      image: projectImage,
      alt: "春日庭院插画：阳光、绿叶与猫咪",
      imageLabel: "插画壁纸",
      imagePosition: "50% 50%",
      kind: "world",
    },
    {
      number: "02",
      title: "Music & Memories",
      subtitle: "音乐与回忆",
      index: "Songs / Live / Photographs",
      path: "/music",
      action: "进入音乐与回忆",
      image: memoryImage,
      alt: "音乐主题插画：花海与手持麦克风的角色",
      imageLabel: "插画壁纸",
      imagePosition: "50% 48%",
      kind: "music",
    },
  ],
};
