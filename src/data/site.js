
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

export function headerMenuFor(categories = []) {
  const icons = Object.fromEntries(site.navigation.map(item => [item.path, item.icon]));
  return [
    { label: '主页', path: '/', icon: icons['/'] },
    { label: '文章', icon: icons['/unity-notes'], children: [{ label: '全部笔记', path: '/unity-notes' }, ...categories.map(category => ({ label: category, path: { path: '/unity-notes', query: { category } } }))] },
    { label: '社交', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', children: site.socials.map(link => ({ label: link.label, url: link.url })) },
    { label: '我的', icon: icons['/world'], children: site.navigation.filter(item => ['/world', '/music', '/little-things'].includes(item.path)) },
    { label: '关于', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 11v6M12 7h.01', children: [{ label: '关于 Peanora', path: '/world#about' }, { label: '正在学习', path: '/world#unity-notes' }] },
    { label: '链接', icon: 'M10 13a5 5 0 0 0 7 .5l4-4a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.5l-4 4a5 5 0 0 0 7 7l2-2', children: [{ label: 'Peanora 的 GitHub', url: 'https://github.com/Peanora' }, { label: '本站源码', url: 'https://github.com/Peanora/peanoras-space' }] },
  ];
}
