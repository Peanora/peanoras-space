import photo from "../assets/images/photo-placeholder.svg";

export const memories = [
  {
    id: "memory-draft-01",
    title: "一段现场回忆",
    date: null,
    location: null,
    paragraphs: ["这里将放入演唱会的日期、地点、照片，以及想留下的记忆。"],
    photos: [
      {
        src: photo,
        alt: "演唱会照片占位，尚未添加真实摄影素材",
        caption: "照片待添加",
        isPlaceholder: true,
      },
    ],
    mementos: [],
    isPlaceholder: true,
  },
];
