export const HOME_ROLE_OPTIONS = [
  { id: 'cpp', label: 'C++ 开发工程师' },
  { id: 'backend', label: '后端开发工程师' },
  { id: 'embedded', label: '嵌入式开发工程师' },
  { id: 'direction', label: '探索方向' },
] as const;

export type HomeRoleId = (typeof HOME_ROLE_OPTIONS)[number]['id'];

export const HOME_ROLE_LABELS = HOME_ROLE_OPTIONS.map((item) => item.label);

export function getHomeRoleLabel(roleId: HomeRoleId) {
  return HOME_ROLE_OPTIONS.find((item) => item.id === roleId)?.label ?? HOME_ROLE_OPTIONS[3].label;
}
