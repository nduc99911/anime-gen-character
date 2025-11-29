
import { GoogleGenAI } from "@google/genai";
import { CharacterConfig, ArtStyle, ViewAngle } from "../types";

// Initialize the client strictly according to guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const buildPrompt = (config: CharacterConfig): string => {
  let stylePrompt = "";
  switch (config.style) {
    case ArtStyle.ANIME_2D:
      stylePrompt = "high quality anime art style, 2d cel shaded, flat color, japanese anime style";
      break;
    case ArtStyle.RENDER_3D:
      stylePrompt = "3d render, unreal engine 5, octane render, cgi character, pixar style, detailed textures, volumetric lighting";
      break;
    case ArtStyle.WATERCOLOR:
      stylePrompt = "soft watercolor painting, artistic, ethereal, dreamy colors";
      break;
    case ArtStyle.MANGA:
      stylePrompt = "manga style, black and white, screen tones, detailed ink lines";
      break;
    case ArtStyle.CHIBI:
      stylePrompt = "chibi style, super deformed, cute, big head small body";
      break;
  }

  let viewPrompt = "";
  switch (config.view) {
    case ViewAngle.FRONT:
      viewPrompt = "front view, full body shot";
      break;
    case ViewAngle.SIDE:
      viewPrompt = "side profile view, full body";
      break;
    case ViewAngle.BACK:
      viewPrompt = "view from behind, back view";
      break;
    case ViewAngle.TURNAROUND:
      viewPrompt = "character reference sheet, multiple views, front view, side view, back view, concept art layout";
      break;
    case ViewAngle.DYNAMIC:
      viewPrompt = "dynamic action camera angle, dutch angle, cinematic composition";
      break;
  }

  const posePrompt = config.pose === "Tự do sáng tạo (Nhập mô tả)" && config.customPose 
    ? `Action Pose: ${config.customPose}`
    : `Pose: ${config.pose}`;

  const effectPrompt = config.effects && config.effects !== 'Không có' 
    ? `Special Visual Effects: ${config.effects}, glowing, particle effects, detailed VFX` 
    : "";

  return `
    Character Design: ${stylePrompt}.
    Subject: A ${config.gender} character.
    Appearance: ${config.hairStyle} ${config.hairColor} hair, ${config.eyeColor} eyes, ${config.expression} expression.
    Outfit: Wearing ${config.clothing}.
    Accessories: Equipped with ${config.accessories}.
    ${posePrompt}.
    View: ${viewPrompt}.
    Background: ${config.background}.
    Lighting: ${config.lightingStyle}, ${config.lightingColor} color tone.
    ${effectPrompt}.
    Quality: Masterpiece, best quality, ultra-detailed, 8k resolution, perfect anatomy, highres.
  `.trim();
};

export const generateCharacterImage = async (config: CharacterConfig): Promise<string> => {
  try {
    const prompt = buildPrompt(config);
    
    // Using gemini-2.5-flash-image as requested for general image generation tasks
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        // We do not set responseMimeType for image models unless it's strictly JSON text which is not the case here.
        // We rely on the model returning inlineData for the image.
      }
    });

    // Check for inlineData in parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Không thể tạo hình ảnh. Vui lòng thử lại.");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};
