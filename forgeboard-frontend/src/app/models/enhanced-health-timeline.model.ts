import { HealthTimelinePoint } from '@forge-board/shared/api-interfaces';

/**
 * Extended HealthTimelinePoint interface with UI-specific properties
 */
export interface EnhancedHealthTimelinePoint extends HealthTimelinePoint {
  icon?: string;
  title?: string;
  content?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  showDetails?: boolean;
}
