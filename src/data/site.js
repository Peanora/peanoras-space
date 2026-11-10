
export const site = {
  name: "Peanora's Space",
  nickname: "Peanora",
  socials: [{ label: "GitHub", url: "https://github.com/Peanora" }],
  navigation: [
    { label: '首页', path: '/', icon: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9' },
    { label: '我的世界', sidebarLabel: '我的个人世界', path: '/world', icon: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z' },
    { label: 'Unity 笔记', sidebarLabel: 'Unity 学习笔记', path: '/unity-notes', icon: 'M4 4h7a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4V4Zm16 0h-6m0 17a4 4 0 0 1 4-3h2V4' },
    { label: '音乐与回忆', path: '/music', icon: 'M9 18V5l11-2v12M9 8l11-2M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
    { label: '小角落', path: '/little-things', icon: 'M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z' },
  ],

};

// Navigation destinations share their paths and page descriptions with the
// router and generated Pages HTML entries. Personal content stays in JSON.
export const sectionPages = [
  { path: '/archive', label: '归档', title: 'Archives', kind: 'archive', description: '按目录翻阅 Peanora 已发布的学习笔记。' },
  { path: '/categories', label: '分类', title: 'Categories', kind: 'categories', description: '按主题分类浏览 Peanora 的学习笔记。' },
  { path: '/tags', label: '标签', title: 'Tags', kind: 'tags', description: 'Peanora 的文章标签索引。' },
  { path: '/series', label: '系列', title: 'Series', kind: 'series', description: 'Peanora 的系列文章索引。' },
  { path: '/diary', label: '动态', title: 'Diary', kind: 'diary', description: 'Peanora 的动态与近况。', empty: '还没有发布动态。' },
  { path: '/projects', label: '项目', title: 'Projects', kind: 'projects', description: 'Peanora 的项目与作品。', empty: '项目正在整理，准备好后会放在这里。' },
  { path: '/albums', label: '相册', title: 'Albums', kind: 'albums', description: 'Peanora 的相册。', empty: '相册暂时留白，等待下一份回忆。' },
  { path: '/bookmarks', label: '书签导航', title: 'Bookmarks', kind: 'bookmarks', description: 'Peanora 收集的网页书签。', empty: '还没有添加书签。' },
  { path: '/bilibili', label: '哔哩哔哩', title: 'Bilibili', kind: 'bilibili', description: 'Peanora 的哔哩哔哩入口。', empty: '还没有添加哔哩哔哩主页。' },
  { path: '/friends', label: '友链', title: 'Friends', kind: 'friends', description: 'Peanora 的朋友们与友情链接。', empty: '友链席位暂时留白。' },
  { path: '/guestbook', label: '留言', title: 'Guestbook', kind: 'guestbook', description: 'Peanora 的留言板。', empty: '留言板暂未开放。' },
];

export function headerMenuFor() {
  const icons = Object.fromEntries(site.navigation.map(item => [item.path, item.icon]));
  const pageLink = kind => {
    const page = sectionPages.find(item => item.kind === kind);
    return { label: page.label, path: page.path };
  };
  return [
    { label: '主页', path: '/', icon: icons['/'] },
    { label: '文章', icon: icons['/unity-notes'], children: ['archive', 'categories', 'tags', 'series'].map(pageLink) },
    { label: '社交', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', children: ['friends', 'guestbook'].map(pageLink) },
    { label: '我的', icon: icons['/world'], children: [
      ...['diary', 'projects', 'albums', 'bookmarks', 'bilibili'].map(pageLink),
      { label: '我的小角落', path: '/#little' },
      { label: 'Music&Memories', path: '/music' },
    ] },
    { label: '关于', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 11v6M12 7h.01', children: [{ label: '本站源码', url: 'https://github.com/Peanora/peanoras-space' }] },
    { label: '链接', icon: 'M10 13a5 5 0 0 0 7 .5l4-4a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.5l-4 4a5 5 0 0 0 7 7l2-2', children: [{ label: 'GitHub', url: 'https://github.com/Peanora' }] },
  ];
}
