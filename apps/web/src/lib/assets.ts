/** 把 /images、/models 等绝对资源路径接到部署 base 下（本地 /，线上 /wangshu/）。 */
export function assetUrl(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  const root = import.meta.env.BASE_URL;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return root.endsWith("/") ? root + clean : root + "/" + clean;
}
