export interface DocFile {
  name: string;
  path: string;
  title: string;
  category?: string;
  lastModified?: string;
  isDirectory?: boolean;
  type?: 'markdown' | 'pdf' | 'audio' | 'image' | 'other';
  size?: number;
}
