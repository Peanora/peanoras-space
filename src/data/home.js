import { site } from "./site";
import nap from "../assets/artwork/web/afternoon-nap.webp";

export const homeScreens = [
  { id: "cover", title: site.name, shortTitle: "首页", kind: "cover" },
  {
    ...site.themes[0],
    id: "world",
    shortTitle: "World",
    description: "个人介绍、游戏开发项目与学习经历。",
    artworkNote: "春日庭院",
    bookmark: "个人世界",
    tags: ["About", "Projects", "Experience"],
    kind: "world",
  },
  {
    ...site.themes[1],
    id: "music",
    shortTitle: "Music",
    description: "歌曲收藏、演唱会回忆与图片收藏。",
    artworkNote: "花海与歌",
    bookmark: "音乐回忆",
    kind: "music",
  },
  {
    id: "little",
    number: "03",
    title: "Little Things",
    shortTitle: "Little",
    subtitle: "个人小角落",
    index: "Notes / Favorites / Surprises",
    description: "换一句文字，留一份收藏，找一点小惊喜。",
    action: "去小角落看看",
    path: "/little-things",
    image: nap,
    imagePosition: "50% 50%",
    alt: "午后小憩插画：阳光、抱枕与猫咪",
    artworkNote: "午后小憩",
    bookmark: "小角落",
    kind: "little",
  },
];
