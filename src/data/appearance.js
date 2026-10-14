import avatar from "../assets/artwork/avatar.jpg";
import autumn from "../assets/artwork/autumn-forest.jpg";
import spring from "../assets/artwork/spring-garden.jpg";
import flowers from "../assets/artwork/flower-stage.jpg";
import sea from "../assets/artwork/summer-sea.jpg";
import winter from "../assets/artwork/winter-window.jpg";
import nap from "../assets/artwork/afternoon-nap.jpg";
import city from "../assets/artwork/city-evening.jpg";
import laundry from "../assets/artwork/laundry-day.jpg";
import dream from "../assets/artwork/golden-dream.jpg";
import sunflower from "../assets/artwork/sunflower-sky.jpg";

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
