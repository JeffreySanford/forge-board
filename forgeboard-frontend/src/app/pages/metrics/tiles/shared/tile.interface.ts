export interface Tile {
  title: string;
  subtitle: string;
  icon: string;
  loading: boolean;
  refresh(): void;
  row: number; // <-- Now required
  col: number; // <-- Now required
}
