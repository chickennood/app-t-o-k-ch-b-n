
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { type FormState, type Shot, type PlatformConfig, type GenerationResult, type VideoPlan, type PublishingInfo, type VoiceoverScript } from "../types";
import { PLATFORM_CONFIG } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = ai.models;

// --- Schema Definitions ---
const publishingInfoSchema = {
    type: Type.OBJECT,
    properties: {
        title: { 
            type: Type.STRING, 
            description: "Tiêu đề hấp dẫn cho video, tuân thủ giới hạn ký tự." 
        },
        description: { 
            type: Type.STRING, 
            description: "Mô tả video, bao gồm hook, tóm tắt và CTA."
        },
        hashtags: { 
            type: Type.STRING, 
            description: "Một chuỗi các hashtag được phân tách bằng dấu cách, tuân thủ các quy tắc về số lượng."
        },
    },
    required: ['title', 'description', 'hashtags'],
};

const videoPlanSchema = {
    type: Type.OBJECT,
    properties: {
      structure: {
        type: Type.OBJECT,
        properties: {
          hook: { type: Type.STRING, description: "Hook hấp dẫn cho phần đầu video." },
          body: { type: Type.STRING, description: "Nội dung chính của video." },
          cta: { type: Type.STRING, description: "Kêu gọi hành động ở cuối video." },
        },
        required: ['hook', 'body', 'cta'],
      },
      audio: {
        type: Type.OBJECT,
        properties: {
          voiceover_style: { type: Type.STRING, description: "Phong cách của giọng lồng tiếng." },
          music_guideline: { type: Type.STRING, description: "Hướng dẫn về nhạc nền." },
        },
        required: ['voiceover_style', 'music_guideline'],
      },
      captions: {
        type: Type.OBJECT,
        properties: {
          enabled: { type: Type.BOOLEAN, description: "Người dùng có bật phụ đề hay không." },
          required: { type: Type.BOOLEAN, description: "Nền tảng có yêu cầu phụ đề hay không." },
          style: { type: Type.STRING, description: "Kiểu của phụ đề." },
        },
        required: ['enabled', 'required', 'style'],
      },
      editing: {
        type: Type.OBJECT,
        properties: {
          pace_seconds_per_cut: { type: Type.NUMBER, description: "Số giây trung bình cho mỗi cảnh cắt." },
          transitions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Các loại chuyển cảnh sẽ sử dụng." },
          text_safe_area: { type: Type.STRING, description: "Vùng an toàn cho văn bản trên màn hình." },
        },
        required: ['pace_seconds_per_cut', 'transitions', 'text_safe_area'],
      },
      shots: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            shot: { type: Type.INTEGER },
            time_start_s: { type: Type.INTEGER },
            time_end_s: { type: Type.INTEGER },
            visual: { type: Type.STRING },
            on_screen_text: { type: Type.STRING },
            transition: { type: Type.STRING },
            render_text_overlay: { type: Type.BOOLEAN, description: "Có hiển thị lớp phủ văn bản cho cảnh này không." },
          },
          required: ['shot', 'time_start_s', 'time_end_s', 'visual', 'on_screen_text', 'transition', 'render_text_overlay'],
        },
        description: "Danh sách chi tiết các cảnh quay video, không bao gồm chi tiết lồng tiếng."
      },
      platform_extras: {
        type: Type.OBJECT,
        properties: {
            productId: { type: Type.STRING },
            price: { type: Type.STRING },
            voucher: { type: Type.STRING },
        },
        description: "Các trường thông tin thêm dành riêng cho nền tảng như Shopee."
      },
    },
    required: ['structure', 'audio', 'captions', 'editing', 'shots'],
};

const voiceoverScriptSchema = {
    type: Type.OBJECT,
    properties: {
        segment_index: { type: Type.INTEGER, description: "Chỉ số của phân đoạn này." },
        duration_seconds: { type: Type.INTEGER, description: "Thời lượng của kịch bản này, nên là 8." },
        voiceover_script: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    t: { type: Type.NUMBER, description: "Mốc thời gian (giây) để bắt đầu đọc câu thoại." },
                    text: { type: Type.STRING, description: "Câu thoại." }
                },
                required: ['t', 'text'],
            }
        }
    },
    required: ['segment_index', 'duration_seconds', 'voiceover_script'],
};

const EMOJI_DEFAULTS: Record<string, {enabled:boolean; style:"minimal"|"normal"|"extra"; palette:string[]}> = {
    tiktok:  { enabled:true,  style:"normal", palette:["🔥","✨","⚡️","🎯","💡","🚀","📱","🎵","📸","😄"] },
    shorts:  { enabled:true,  style:"normal", palette:["🔥","✨","⚡️","🎯","💡","🚀","📱","🎵","📸","😄"] },
    reels:   { enabled:true,  style:"normal", palette:["🔥","✨","⚡️","🎯","💡","🚀","📱","🎵","📸","😄"] },
    youtube: { enabled:false, style:"minimal", palette:["✨","🎯","💡","📌","🧠"] },
    shopee:  { enabled:true,  style:"normal", palette:["🛒","🛍️","📦","💥","💸","🏷️","⚡️"] },
  };

const SHORT_FORM_VIDEO_FORMULA = `
--- CÔNG THỨC VIDEO GIẢI TRÍ NGẮN 2025 ---
1.  **Khung 5-nhịp (Universal Beat)**:
    *   **Hook (0-3s)**: Đưa kết quả/tình huống gay cấn lên trước. Ví dụ: "Tôi thử {chủ đề} trong {thời gian} và đây là {kết quả}!".
    *   **Set-up (3-6s)**: Đặt bối cảnh cực ngắn (ai/ở đâu/làm gì).
    *   **Turn (6-12s)**: Twist/hài hước/bất ngờ, đổi nhịp, đổi góc.
    *   **Payoff (12-…s)**: Cái kết "đã", meme/punchline/reveal.
    *   **CTA (cuối video)**: 1 hành động duy nhất (Follow, Comment, Thử trend).
2.  **Nguyên tắc dựng (Editing Principles)**:
    *   **Nhịp độ nhanh**: Mỗi câu/ý tương ứng 1 cut.
    *   **Pattern-Interrupt**: Mỗi 2-4s phải có sự thay đổi (đổi góc, zoom, chèn gag, SFX) để giữ sự chú ý.
    *   **Âm thanh**: Nhạc nền hợp mạch, chèn SFX đúng điểm rơi, voice rõ ràng.
`;

// --- Helper Functions ---
const snapTo8s = (n: number) => Math.max(8, Math.round(n / 8) * 8);
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function buildPublishingInfoPrompt(cfg: PlatformConfig, dur: number, topic: string, persona: string, emojiConfig: { enabled: boolean; style: string; palette: string[]; mascot: string; platform: string; }): string {
    const { enabled, style, palette, mascot, platform } = emojiConfig;
    
    const titleEmojiRules: string[] = [];
    if (enabled) {
      const maxEmojis = style === 'minimal' ? 1 : style === 'normal' ? 2 : 3;
      titleEmojiRules.push(`- Phong cách: ${style}. Dùng từ 0-${maxEmojis} emoji.`);
      titleEmojiRules.push(`- Chỉ dùng emoji từ bộ sau: ${palette.join(" ")}`);
      if (mascot) {
        titleEmojiRules.push(`- Mascot emoji "${mascot}" có thể xuất hiện tối đa 1 lần, ở cuối tiêu đề.`);
      }
    } else {
      titleEmojiRules.push("- Không dùng bất kỳ emoji nào.");
    }
    const titleRules = `**Tiêu đề (title):**
- Viết một tiêu đề hấp dẫn cho ${cfg.label}, không quá ${cfg.seo.titleMaxChars} ký tự.
- Cân nhắc áp dụng công thức hook: "chủ đề + kết quả lớn + thời gian ngắn + nỗ lực ít".
- Quy tắc Emoji cho tiêu đề:\n${titleEmojiRules.join("\n")}`;

    const strongCtaEmojis = platform === 'shopee' ? '🛒💥💸' : '✨🎯🚀';
    const descriptionEmojiRules = enabled ? [
        `- Dòng 1 (Hook): Cho phép 0-1 emoji từ bộ: ${palette.join(" ")}`,
        `- Dòng 2-3 (Thân bài): Tối đa 1 emoji mỗi dòng.`,
        `- Dòng cuối (CTA): Thêm 1 emoji mạnh (ví dụ từ: ${strongCtaEmojis}).`,
        `- Mascot: Mascot emoji "${mascot}" có thể dùng 1 lần ở cuối mô tả (không bắt buộc).`,
        `- Không đặt emoji trong hashtags.`
    ] : ["- Không dùng bất kỳ emoji nào."];
    const descriptionRules = `**Mô tả (description):**
- Viết một mô tả từ 2-4 dòng theo cấu trúc sau:
  - Dòng 1: Một câu Hook ngắn, hấp dẫn, lặp lại ý chính của video.
  - Dòng 2-3: Tóm tắt 1-2 ý chính hoặc lợi ích cốt lõi.
  - Dòng cuối: Một lời kêu gọi hành động (CTA) rõ ràng, theo hướng dẫn: "${cfg.ctaGuideline}".
- Nếu là YouTube và thời lượng > 30s, hãy thêm phần "Chapters" phù hợp với tổng thời lượng ${dur}s.
- Quy tắc Emoji cho mô tả:\n${descriptionEmojiRules.join("\n")}`;
    
    const requiredHashtags = (cfg.seo.requiredHashtags || []).join(" ");
    const hashtagsRules = `**Hashtags:**
- Tạo ra từ ${cfg.seo.hashtagCount.min} đến ${cfg.seo.hashtagCount.max} hashtag.
- Các hashtag phải liên quan chặt chẽ đến chủ đề "${topic}".
- Bắt buộc phải có các hashtag sau (nếu có): ${requiredHashtags}.
- Trả về dưới dạng một chuỗi duy nhất, các hashtag cách nhau bằng dấu cách (ví dụ: "#tag1 #tag2 #tag3").`;

    return `BẠN LÀ MỘT CHUYÊN GIA SÁNG TẠO NỘI DUNG MẠNG XÃ HỘI.
    
**Bối cảnh:**
- **Chủ đề:** "${topic}"
- **Nền tảng:** ${cfg.label}
- **Nhân vật:** "${persona}"

**Nhiệm vụ:**
Dựa trên bối cảnh trên, hãy tạo một đối tượng JSON chứa 'title', 'description', và 'hashtags'. Tuân thủ nghiêm ngặt tất cả các quy tắc và ràng buộc cho từng trường được nêu dưới đây.

---
${titleRules}
---
${descriptionRules}
---
${hashtagsRules}
---

**Đầu ra:**
Chỉ trả về đối tượng JSON, không có giải thích hay markdown nào khác.`;
}

// --- Prompt Builders ---
function buildVideoFramesForSegment(cfg: PlatformConfig, persona: string, topic: string, segIndex: number, segTotal: number, captionsEnabled: boolean, previousPlans: VideoPlan[]) {
  const subtitlesLine = captionsEnabled
      ? `- Phụ đề: ${cfg.captions.required ? 'BẮT BUỘC' : 'Tùy chọn'} • Kiểu: ${cfg.captions.style[0]}`
      : `- Phụ đề: ĐÃ TẮT. "on_screen_text" phải là chuỗi rỗng và "render_text_overlay" phải là false cho tất cả các cảnh.`;

  let contextPrompt = "";
  if (segIndex > 1 && previousPlans.length > 0) {
      const lastPlan = previousPlans[previousPlans.length - 1];
      const lastShot = lastPlan.shots[lastPlan.shots.length - 1];
      const contextSummary = `Phân đoạn trước đó (${segIndex - 1}/${segTotal}) đã nói về "${lastPlan.structure.body}" và kết thúc bằng cảnh: "${lastShot.visual}".`;
      contextPrompt = `QUAN TRỌNG: BỐI CẢNH TIẾP NỐI\n${contextSummary}\n\nNHIỆM VỤ CỦA BẠN LÀ TẠO PHÂN ĐOẠN ${segIndex} TIẾP THEO MỘT CÁCH LIỀN MẠCH, phát triển ý tưởng từ phân đoạn trước.`;
  }

  let segmentRole = "Thân bài (Body) - Phát triển câu chuyện.";
    if (segIndex === 1) {
        segmentRole = "Mở đầu (Hook) - Phải giữ chân người xem trong 3 giây đầu tiên.";
    } else if (segIndex === segTotal) {
        segmentRole = "Kết thúc (Payoff & CTA) - Đưa ra cái kết thỏa mãn và kêu gọi hành động.";
    } else if (segIndex === 2) {
        segmentRole = "Thiết lập (Set-up) - Giới thiệu bối cảnh sau hook.";
    } else {
        segmentRole = "Diễn biến (Turn) - Tạo ra một bước ngoặt hoặc sự bất ngờ."
    }

  const frames = [
    `BẠN LÀ MỘT CHUYÊN GIA SÁNG TẠO KỊCH BẢN VIDEO NGẮN. HÃY TUÂN THỦ CÔNG THỨC SAU:`,
    SHORT_FORM_VIDEO_FORMULA,
    contextPrompt,
    `BỐI CẢNH CHO PHÂN ĐOẠN ${segIndex}/${segTotal} (8 giây):
- Nền tảng: ${cfg.label}
- Tỷ lệ khung hình: ${cfg.aspectRatio}
- Chủ đề: ${topic}
- ADN Nhân vật: ${persona}
- VAI TRÒ CỦA PHÂN ĐOẠN NÀY: ${segmentRole}`,
    `YÊU CẦU ÂM THANH & PHỤ ĐỀ:
- Nhạc: ${cfg.musicGuideline}
${subtitlesLine}`,
    `NHIỆM VỤ: Dựa trên vai trò của phân đoạn này và bối cảnh đã cho, hãy tạo một đối tượng JSON cho kế hoạch video HÌNH ẢNH. Hãy sáng tạo, cụ thể và áp dụng các nguyên tắc "Pattern-Interrupt" và "Nhịp độ nhanh". Kế hoạch phải tuân thủ nghiêm ngặt trạng thái phụ đề. Chỉ trả về đối tượng JSON, không giải thích thêm.`
  ].filter(Boolean).join("\n\n---\n\n");
  return frames;
}

function buildDialogueFramesForSegment(
    cfg: PlatformConfig,
    persona: string,
    topic: string,
    segIndex: number,
    segTotal: number,
    voiceTone: string,
    videoPlan: VideoPlan,
    previousScripts: VoiceoverScript[]
) {
    const shotDetails = (videoPlan.shots || []).map(shot => 
        `- Cảnh ${shot.shot} [${shot.time_start_s}s - ${shot.time_end_s}s]:\n  • Hình ảnh: ${shot.visual}\n  • Chữ trên màn hình: ${shot.on_screen_text || "Không có"}`
    ).join('\n');

    let dialogueContextPrompt = "";
    if (segIndex > 1 && previousScripts.length > 0) {
        const lastScript = previousScripts[previousScripts.length - 1];
        const lastLine = lastScript.voiceover_script.slice(-1)[0]?.text || "[không có lời thoại]";
        dialogueContextPrompt = `LƯU Ý VỀ TÍNH LIỀN MẠCH:\n- Câu thoại cuối cùng của phân đoạn trước là: "${lastLine}"\n- Hãy viết lời thoại cho phân đoạn này để câu chuyện tiếp diễn một cách tự nhiên.`;
    }

    const frames = [
        `BỐI CẢNH LỒNG TIẾNG CHO PHÂN ĐOẠN ${segIndex}/${segTotal} (8 giây):
- Chủ đề: ${topic}
- Nhân vật lồng tiếng: ${persona}
- Phong cách chung: ${cfg.voiceoverStyle[0] || "rõ ràng, ngắn gọn"}
- YÊU CẦU TÔNG GIỌNG CỤ THỂ: "${voiceTone}"`,
        dialogueContextPrompt,
        `KẾ HOẠCH HÌNH ẢNH CHI TIẾT ĐÃ ĐƯỢC TẠO CHO PHÂN ĐOẠN NÀY (TUÂN THỦ NGHIÊM NGẶT):
${shotDetails}`,

        `NHIỆM VỤ: Dựa vào kế hoạch hình ảnh ở trên, hãy viết kịch bản lồng tiếng TỰ NHIÊN và ĐỒNG BỘ.
- Lời thoại phải trực tiếp bình luận, giải thích, hoặc bổ sung cho các cảnh quay và văn bản trên màn hình.
- ÁP DỤNG NGUYÊN TẮC: "mỗi câu/ý tương ứng 1 cut". Viết các câu ngắn, gãy gọn, dễ nghe.
- RÀNG BUỘC THỜI GIAN NGHIÊM NGẶT: Tổng thời lượng đọc của TOÀN BỘ kịch bản cho phân đoạn này KHÔNG ĐƯỢC VƯỢT QUÁ 7.5 GIÂY. Hãy viết thật ngắn gọn và súc tích (khoảng 20-25 từ tối đa).
- Đảm bảo lời thoại khớp chính xác với thời gian của các cảnh.`,

        `NHIỆM VỤ CUỐI CÙNG: Trả về một đối tượng JSON cho kịch bản lồng tiếng khớp với schema được yêu cầu. Đảm bảo segment_index là ${segIndex}. Chỉ trả về đối tượng JSON, không giải thích thêm.`
    ].filter(Boolean).join("\n\n---\n\n");
    return frames;
}
  
function parseJsonResponse<T,>(rawText: string): T {
    try {
        const cleanedText = rawText.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
        return JSON.parse(cleanedText) as T;
    } catch (error) {
        console.error("Không thể phân tích phản hồi JSON:", rawText);
        throw new Error("AI đã trả về một định dạng JSON không hợp lệ. Vui lòng thử lại.");
    }
}

// --- Main Service Function ---
export async function generateVideoPrompts(formState: FormState): Promise<GenerationResult> {
  const { platform, persona_dna, topic, duration_sec, captionsEnabled, extras, voiceTone, emoji_enabled, emoji_style, mascot_emoji } = formState;

  // 1. Normalize & Calculate Segments
  const cfg = PLATFORM_CONFIG[platform];
  const dur = clamp(snapTo8s(duration_sec), cfg.minSec, cfg.maxSec);
  const numSegments = Math.max(1, Math.round(dur / 8));

  const generationConfig = {
    temperature: 0.7,
    maxOutputTokens: 8192,
  };

  const platformEmojiDefaults = EMOJI_DEFAULTS[platform] || { enabled:false, style:"minimal", palette:[] };
  
  const finalEmojiConfig = {
      enabled: emoji_enabled ?? platformEmojiDefaults.enabled,
      style: emoji_style ?? platformEmojiDefaults.style,
      palette: platformEmojiDefaults.palette,
      mascot: mascot_emoji ?? "🦡",
      platform: platform
  };
  
  try {
    // Sequentially generate segments to ensure context and continuity
    const video_plans: VideoPlan[] = [];
    const voiceover_scripts: VoiceoverScript[] = [];

    for (let i = 0; i < numSegments; i++) {
        const segIndex = i + 1;

        // First, generate the video plan, using context from previous plans
        const videoPlanPromptText = buildVideoFramesForSegment(cfg, persona_dna, topic, segIndex, numSegments, captionsEnabled, video_plans);
        const videoPlanResponse = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: videoPlanPromptText,
            config: { ...generationConfig, responseMimeType: "application/json", responseSchema: videoPlanSchema },
        });

        // Add a small delay to avoid hitting rate limits too quickly
        await new Promise(resolve => setTimeout(resolve, 500));

        const videoPlanPartial = parseJsonResponse<Partial<VideoPlan>>(videoPlanResponse.text);

        const currentFullVideoPlan: VideoPlan = {
            version: 1,
            language: 'vi',
            platform: cfg.label,
            aspect_ratio: cfg.aspectRatio,
            duration_seconds: 8,
            persona_dna: persona_dna,
            topic: topic,
            structure: videoPlanPartial.structure!,
            audio: videoPlanPartial.audio!,
            captions: {
                ...(videoPlanPartial.captions!),
                enabled: captionsEnabled,
                style: captionsEnabled ? (videoPlanPartial.captions?.style || cfg.captions.style[0]) : "",
            },
            editing: videoPlanPartial.editing!,
            shots: (videoPlanPartial.shots || []).map(shot => ({
                ...shot,
                on_screen_text: captionsEnabled ? (shot.on_screen_text || '') : '',
                render_text_overlay: captionsEnabled,
            })),
            platform_extras: platform === 'shopee' ? extras : {},
        };

        const dialoguePromptText = buildDialogueFramesForSegment(cfg, persona_dna, topic, segIndex, numSegments, voiceTone, currentFullVideoPlan, voiceover_scripts);
        const voiceoverResponse = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: dialoguePromptText,
            config: { ...generationConfig, responseMimeType: "application/json", responseSchema: voiceoverScriptSchema },
        });
        const voiceoverScript = parseJsonResponse<VoiceoverScript>(voiceoverResponse.text);
        
        video_plans.push(currentFullVideoPlan);
        voiceover_scripts.push(voiceoverScript);

        // Add a small delay before the next iteration
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const publishingInfoPrompt = buildPublishingInfoPrompt(cfg, dur, topic, persona_dna, finalEmojiConfig);
    const publishingInfoResponse = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: publishingInfoPrompt,
        config: { ...generationConfig, responseMimeType: "application/json", responseSchema: publishingInfoSchema },
    });
    const publishingInfo = parseJsonResponse<PublishingInfo>(publishingInfoResponse.text);
    
    return { video_plans, voiceover_scripts, publishingInfo };

  } catch (error) {
    console.error("Lỗi gọi Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('Khóa API Gemini của bạn không hợp lệ. Vui lòng đảm bảo nó được cấu hình chính xác.');
    }
    if (error instanceof Error && error.message.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Bạn đã vượt quá hạn ngạch hiện tại. Vui lòng kiểm tra gói và chi tiết thanh toán của bạn hoặc đợi một lát rồi thử lại.');
    }
    throw new Error('Không thể tạo kịch bản từ Gemini. Model có thể bị quá tải hoặc yêu cầu không hợp lệ.');
  }
}

// --- Image Generation Service Function ---
export async function generateHookImage(videoPlan: VideoPlan): Promise<string> {
    const { topic, persona_dna, shots, aspect_ratio } = videoPlan;
    if (!shots || shots.length === 0) {
        throw new Error("Kế hoạch video không có cảnh nào để tạo ảnh.");
    }

    const firstShot = shots[0];

    const imagePrompt = `Một hình ảnh thumbnail video chuyên nghiệp, chất lượng cao, sống động với tỷ lệ khung hình ${aspect_ratio}. Video có chủ đề: "${topic}". Hình ảnh cần nắm bắt được bản chất của cảnh quay đầu tiên: "${firstShot.visual}". Phong cách và nhân vật tổng thể phải khớp với mô tả sau: "${persona_dna}". Không bao gồm bất kỳ văn bản nào trong hình ảnh.`;

    try {
        const response = await model.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: imagePrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error("Không tìm thấy dữ liệu hình ảnh trong phản hồi của Gemini.");

    } catch (error) {
        console.error("Lỗi gọi API tạo ảnh Gemini:", error);
        throw new Error('Không thể tạo ảnh từ Gemini. Model có thể bị quá tải hoặc yêu cầu không hợp lệ.');
    }
}

// --- Image Edit Service Function ---
export async function editHookImage(base64DataUrl: string, editText: string): Promise<string> {
    if (!base64DataUrl.startsWith('data:image/')) {
        throw new Error("Invalid image data URL format provided.");
    }
    if (!editText.trim()) {
        throw new Error("Edit text cannot be empty.");
    }

    const base64ImageData = base64DataUrl.split(',')[1];
    const mimeType = base64DataUrl.match(/data:(.*);base64/)?.[1] || 'image/png';

    try {
        const response = await model.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: editText,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error("Không tìm thấy dữ liệu hình ảnh trong phản hồi chỉnh sửa của Gemini.");

    } catch (error) {
        console.error("Lỗi gọi API chỉnh sửa ảnh Gemini:", error);
        throw new Error('Không thể chỉnh sửa ảnh từ Gemini. Model có thể bị quá tải hoặc yêu cầu không hợp lệ.');
    }
}

// --- Audio Generation Service Function ---
export async function generateVoiceoverAudio(scriptText: string): Promise<string> {
    if (!scriptText.trim()) {
        throw new Error("Văn bản kịch bản không được để trống.");
    }

    try {
        const response = await model.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: scriptText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            throw new Error("Không tìm thấy dữ liệu âm thanh trong phản hồi của Gemini.");
        }

        return base64Audio;

    } catch (error) {
        console.error("Lỗi gọi API tạo âm thanh Gemini:", error);
        throw new Error('Không thể tạo âm thanh từ Gemini. Model có thể bị quá tải hoặc yêu cầu không hợp lệ.');
    }
}
