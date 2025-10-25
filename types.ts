import { Platform } from './constants';

export interface SeoConfig {
  titleMaxChars: number;
  hashtagCount: {
    min: number;
    max: number;
  };
  requiredHashtags: string[];
}

export interface PlatformConfig {
  label: string;
  aspectRatio: string;
  minSec: number;
  maxSec: number;
  cutPaceSec: number;
  voiceoverStyle: string[];
  musicGuideline: string;
  captions: {
    required: boolean;
    style: string[];
  };
  hookGuideline: string;
  ctaGuideline: string;
  seo: SeoConfig;
  extraFields?: string[];
}

export interface Shot {
  shot: number;
  time_start_s: number;
  time_end_s: number;
  visual: string;
  on_screen_text: string;
  transition: string;
  render_text_overlay: boolean;
}

export interface FormState {
  platform: Platform;
  persona_dna: string;
  topic: string;
  duration_sec: number;
  captionsEnabled: boolean;
  voiceTone: string;
  emoji_enabled: boolean;
  emoji_style: 'minimal' | 'normal' | 'extra';
  mascot_emoji: string;
  extras: {
    productId?: string;
    price?: string;
    voucher?: string;
  };
}

export interface VideoPlan {
  version: number;
  language: string;
  platform: string;
  aspect_ratio: string;
  duration_seconds: number;
  persona_dna: string;
  topic: string;
  structure: {
    hook: string;
    body: string;
    cta: string;
  };
  audio: {
    voiceover_style: string;
    music_guideline: string;
  };
  captions: {
    enabled: boolean;
    required: boolean;
    style: string;
  };
  editing: {
    pace_seconds_per_cut: number;
    transitions: string[];
    text_safe_area: string;
  };
  shots: Shot[];
  platform_extras: object;
}

export interface PublishingInfo {
  title: string;
  description: string;
  hashtags: string;
}

export interface VoiceoverLine {
  t: number;
  text: string;
}

export interface VoiceoverScript {
  segment_index: number;
  duration_seconds: number;
  voiceover_script: VoiceoverLine[];
}

export interface GenerationResult {
    video_plans: VideoPlan[];
    voiceover_scripts: VoiceoverScript[];
    publishingInfo: PublishingInfo;
}