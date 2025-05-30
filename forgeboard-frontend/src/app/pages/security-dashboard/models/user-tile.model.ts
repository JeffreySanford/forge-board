export interface UserTile {
  id: string;
  title: string;
  description: string;
  color: string;
  position: number;
  category: string;
  lastUpdated: Date;
  status: 'active' | 'inactive' | 'warning' | 'critical';
}
