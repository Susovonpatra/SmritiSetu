/**
 * Application Feature Flags for SmritiSetu.
 * Enables zero-downtime rollback or toggling of cognitive game modules.
 */

export const FEATURE_FLAGS = {
  /**
   * Match the Shapes Game for dementia patients (replaces legacy Picture Game).
   * Set to false to instantly restore Picture Game (VisualSemanticGame) in navigation.
   */
  SHAPE_GAME_ENABLED: true,

  /**
   * Text-to-speech audio pronunciation of shapes on pick-up and placement
   */
  SHAPE_TTS_ENABLED: true,

  /**
   * Offline Dexie queue for telemetry
   */
  OFFLINE_TELEMETRY_ENABLED: true
};
