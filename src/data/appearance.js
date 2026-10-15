import avatar from "../assets/artwork/web/avatar.webp";
import autumn from "../assets/artwork/web/autumn-forest.webp";
import spring from "../assets/artwork/web/spring-garden.webp";
import flowers from "../assets/artwork/web/flower-stage.webp";
import sea from "../assets/artwork/web/summer-sea.webp";
import winter from "../assets/artwork/web/winter-window.webp";
import nap from "../assets/artwork/web/afternoon-nap.webp";
import city from "../assets/artwork/web/city-evening.webp";
import laundry from "../assets/artwork/web/laundry-day.webp";
import dream from "../assets/artwork/web/golden-dream.webp";
import sunflower from "../assets/artwork/web/sunflower-sky.webp";

export const appearance = {
  avatar,
  avatarPosition: "63% 45%",
  defaultWallpaper: "autumn",
  // 图片只作为插画壁纸，不作为本人照片、项目截图或演唱会经历。
  wallpapers: [
    {
      id: "autumn",
      name: "秋日树林",
      src: autumn,
      color: "#d9a16e",
      position: "50% 43%",
    },
    {
      id: "spring",
      name: "春日庭院",
      src: spring,
      color: "#a5b781",
      position: "50% 50%",
    },
    {
      id: "flowers",
      name: "花海与歌",
      src: flowers,
      color: "#e7b293",
      position: "50% 45%",
    },
    {
      id: "sea",
      name: "夏日海风",
      src: sea,
      color: "#a9cbd2",
      position: "50% 42%",
    },
    {
      id: "sunflower",
      name: "向日葵晴空",
      src: sunflower,
      color: "#e3c675",
      position: "50% 43%",
    },
    {
      id: "nap",
      name: "午后小憩",
      src: nap,
      color: "#a4bdd2",
      position: "50% 50%",
    },
    {
      id: "winter",
      name: "冬日窗边",
      src: winter,
      color: "#b8b8c9",
      position: "50% 45%",
    },
    {
      id: "city",
      name: "夜晚房间",
      src: city,
      color: "#ba9d96",
      position: "50% 50%",
    },
    {
      id: "laundry",
      name: "晴日小事",
      src: laundry,
      color: "#b8c3ce",
      position: "50% 45%",
    },
    {
      id: "dream",
      name: "金色梦境",
      src: dream,
      color: "#c5ad73",
      position: "50% 50%",
    },
  ],
};
