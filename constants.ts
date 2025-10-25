import { type PlatformConfig } from './types';

export enum Platform {
  TikTok = 'tiktok',
  Shorts = 'shorts',
  YouTube = 'youtube',
  Reels = 'reels',
  Shopee = 'shopee',
}

export const VOICE_TONES = [
  "Thân thiện & Gần gũi",
  "Chuyên nghiệp & Tin cậy",
  "Năng động & Hào hứng",
  "Kể chuyện & Lôi cuốn",
  "Hài hước & Dí dỏm",
  "Nghiêm túc & Sâu sắc"
];

export const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  [Platform.TikTok]: {
    label: "TikTok",
    aspectRatio: "9:16",
    minSec: 5,
    maxSec: 60,
    cutPaceSec: 1.5,
    voiceoverStyle: ["Nhanh, năng lượng cao"],
    musicGuideline: "Nhạc trend BPM 100-140, drop <3s",
    captions: { required: true, style: ["Sub lớn, tương phản cao"] },
    hookGuideline: "Hook <2s: lợi ích cực rõ",
    ctaGuideline: "Nhắc follow/like/lưu",
    seo: { titleMaxChars: 80, hashtagCount: { min: 3, max: 5 }, requiredHashtags: [] }
  },
  [Platform.Shorts]: {
    label: "YouTube Shorts",
    aspectRatio: "9:16",
    minSec: 6,
    maxSec: 60,
    cutPaceSec: 1.8,
    voiceoverStyle: ["Rõ, nhịp nhanh"],
    musicGuideline: "Nhạc thư viện Shorts, intro <1s",
    captions: { required: true, style: ["Auto-caption kiểu YT"] },
    hookGuideline: "Hook <1s: câu hỏi/so sánh",
    ctaGuideline: "Subscribe/Comment ở 90-100%",
    seo: { titleMaxChars: 70, hashtagCount: { min: 3, max: 6 }, requiredHashtags: ["#shorts"] }
  },
  [Platform.YouTube]: {
    label: "YouTube (thường)",
    aspectRatio: "16:9",
    minSec: 120,
    maxSec: 3600,
    cutPaceSec: 3.5,
    voiceoverStyle: ["Storytelling, chuyên gia"],
    musicGuideline: "Nhạc nền nhẹ, đổi motif theo chương",
    captions: { required: true, style: ["Sub nhỏ gọn"] },
    hookGuideline: "Opening 5-10s: vấn đề + promise + preview",
    ctaGuideline: "CTA mềm rải rác + cuối video",
    seo: { titleMaxChars: 70, hashtagCount: { min: 3, max: 10 }, requiredHashtags: [] }
  },
  [Platform.Reels]: {
    label: "Facebook Reels",
    aspectRatio: "9:16",
    minSec: 5,
    maxSec: 90,
    cutPaceSec: 1.7,
    voiceoverStyle: ["Tươi vui"],
    musicGuideline: "Nhạc thư viện Meta",
    captions: { required: true, style: ["Sub lớn, đậm"] },
    hookGuideline: "Hook thị giác mạnh <1.5s",
    ctaGuideline: "Nhắc follow/DM ở 80%",
    seo: { titleMaxChars: 80, hashtagCount: { min: 2, max: 5 }, requiredHashtags: [] }
  },
  [Platform.Shopee]: {
    label: "Shopee",
    aspectRatio: "9:16",
    minSec: 5,
    maxSec: 60,
    cutPaceSec: 1.4,
    voiceoverStyle: ["Bán hàng thuyết phục"],
    musicGuideline: "Nhạc rộn, giữ rõ thoại",
    captions: { required: true, style: ["Price tag", "Sticker mã giảm"] },
    hookGuideline: "Mở đầu nêu DEAL/PAINPOINT",
    ctaGuideline: "Mua ngay/Thêm vào giỏ/Dùng mã",
    seo: { titleMaxChars: 80, hashtagCount: { min: 2, max: 6 }, requiredHashtags: ["#Shopee", "#Deal"] },
    extraFields: ["productId", "price", "voucher"]
  }
};

export const DEFAULT_PERSONA_DNA = `voice: "VN_BARITONE_01"
physics: "không dùng kỹ xảo dịch chuyển; cho phép người/vật thể đi qua che khuất"
style: "thân thiện, gãy gọn, câu ngắn"`;