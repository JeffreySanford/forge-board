export interface Tile {
  title: string;
  subtitle: string;
  icon: string;
  loading: boolean;
  refresh(): void;
}
