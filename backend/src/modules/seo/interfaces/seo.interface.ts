export interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface RedirectResult {
  found: boolean;
  sourcePath: string;
  targetPath?: string;
  statusCode?: number;
}
