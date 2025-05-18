/**
 * Represents the status of a sound service
 */
export interface SoundServiceStatus {
  /**
   * Whether the sound service is available
   */
  available: boolean;
  
  /**
   * Whether the sound service is enabled
   */
  enabled: boolean;
  
  /**
   * Whether sound is currently muted
   */
  muted: boolean;
  
  /**
   * The current volume level (0-100)
   */
  volume?: number;
  
  /**
   * Error message if the service is not available
   */
  errorMessage?: string;
  
  /**
   * Timestamp of the last status update
   */
  lastUpdated?: string;
}

/**
 * Options for playing a sound
 */
export interface SoundPlayOptions {
  /**
   * Volume level for the sound (0-100)
   */
  volume?: number;
  
  /**
   * Whether the sound should loop
   */
  loop?: boolean;
  
  /**
   * Whether to fade in the sound
   */
  fadeIn?: boolean;
  
  /**
   * Delay in milliseconds before playing the sound
   */
  delay?: number;
}

/**
 * Represents an event related to sound
 */
export interface SoundEvent {
  /**
   * Unique identifier for the event
   */
  id: string;
  
  /**
   * The sound associated with the event
   */
  sound: string;
  
  /**
   * Timestamp of the event
   */
  timestamp: string;
  
  /**
   * Source of the event
   */
  source: string;
  
  /**
   * Options for playing the sound
   */
  options?: SoundPlayOptions;
}
