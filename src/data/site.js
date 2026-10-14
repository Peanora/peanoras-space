import projectImage from "../assets/images/project-placeholder.svg";
import memoryImage from "../assets/images/memory-placeholder.svg";

export const site = {
  name: "Peanora's Space",
  nickname: "Peanora",
  socials: [{ label: "GitHub", url: null }],
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
      alt: "项目封面占位：原创几何空间线稿",
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
      alt: "回忆图片占位：原创唱片与纸面构图",
      kind: "music",
    },
  ],
};
