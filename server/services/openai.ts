import OpenAI from "openai";
import { GoogleGenAI, Modality } from "@google/genai";
import fs from "fs";

// Multiple AI provider support
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

const gemini = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "default_key" 
});

// OpenRouter configuration
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "default_key",
});

export type AIProvider = "openai" | "gemini" | "openrouter";

export interface DialogueSuggestion {
  original: string;
  improved: string;
  reason: string;
}

export interface SceneExpansion {
  expandedDescription: string;
  additionalElements: string[];
  suggestedShots: string[];
}

export async function improveDialogue(dialogue: string, mood: string, context: string, provider: AIProvider = "openai"): Promise<DialogueSuggestion> {
  try {
    let result;
    
    if (provider === "gemini") {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: "You are a professional screenwriter and dialogue coach. Improve dialogue to be more engaging, natural, and emotionally resonant. Respond with JSON in this format: { 'original': string, 'improved': string, 'reason': string }",
          responseMimeType: "application/json",
        },
        contents: `Improve this dialogue for a ${mood} scene in the context of: ${context}

Original dialogue: "${dialogue}"

Make it more compelling while keeping it concise and natural.`,
      });
      
      result = JSON.parse(response.text || '{}');
    } else if (provider === "openrouter") {
      const response = await openrouter.chat.completions.create({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content: "You are a professional screenwriter and dialogue coach. Improve dialogue to be more engaging, natural, and emotionally resonant. Respond with JSON in this format: { 'original': string, 'improved': string, 'reason': string }",
          },
          {
            role: "user",
            content: `Improve this dialogue for a ${mood} scene in the context of: ${context}

Original dialogue: "${dialogue}"

Make it more compelling while keeping it concise and natural.`,
          },
        ],
        response_format: { type: "json_object" },
      });
      
      result = JSON.parse(response.choices[0].message.content || '{}');
    } else {
      // OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a professional screenwriter and dialogue coach. Improve dialogue to be more engaging, natural, and emotionally resonant. Respond with JSON in this format: { 'original': string, 'improved': string, 'reason': string }",
          },
          {
            role: "user",
            content: `Improve this dialogue for a ${mood} scene in the context of: ${context}

Original dialogue: "${dialogue}"

Make it more compelling while keeping it concise and natural.`,
          },
        ],
        response_format: { type: "json_object" },
      });
      
      result = JSON.parse(response.choices[0].message.content || '{}');
    }
    
    return {
      original: dialogue,
      improved: result.improved || dialogue,
      reason: result.reason || "No specific improvements suggested",
    };
  } catch (error) {
    throw new Error("Failed to improve dialogue: " + (error as Error).message);
  }
}

export async function expandScene(title: string, description: string, duration: number, provider: AIProvider = "openai"): Promise<SceneExpansion> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a creative director and storyboard expert. Expand scene descriptions with rich visual details, suggest additional elements, and recommend camera shots. Respond with JSON in this format: { 'expandedDescription': string, 'additionalElements': string[], 'suggestedShots': string[] }",
        },
        {
          role: "user",
          content: `Expand this storyboard scene:

Title: ${title}
Current Description: ${description}
Duration: ${duration}ms

Provide:
1. An expanded, more detailed description with visual specifics
2. Additional elements that could enhance the scene (props, lighting, effects)
3. Suggested camera shots and movements that would work well`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      expandedDescription: result.expandedDescription || description,
      additionalElements: result.additionalElements || [],
      suggestedShots: result.suggestedShots || [],
    };
  } catch (error) {
    throw new Error("Failed to expand scene: " + (error as Error).message);
  }
}

export async function generateReferenceImage(description: string, style: string = "photorealistic", provider: AIProvider = "openai"): Promise<{ url: string; localPath?: string }> {
  try {
    const prompt = `${description}. Style: ${style}. High quality, professional, suitable for storyboard reference.`;
    
    if (provider === "gemini") {
      const timestamp = Date.now();
      const imagePath = `uploads/generated_${timestamp}.png`;
      
      // Using Gemini image generation
      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No image generated");
      }

      const content = candidates[0].content;
      if (!content || !content.parts) {
        throw new Error("No image content");
      }

      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          
          // Ensure uploads directory exists
          if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads', { recursive: true });
          }
          
          fs.writeFileSync(imagePath, imageData);
          return { url: `/uploads/generated_${timestamp}.png`, localPath: imagePath };
        }
      }
      
      throw new Error("No image data in response");
    } else {
      // OpenAI DALL-E
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return { url: response.data?.[0]?.url || "" };
    }
  } catch (error) {
    throw new Error("Failed to generate reference image: " + (error as Error).message);
  }
}

export async function generateSceneSuggestions(projectContext: string, existingScenes: string[], provider: AIProvider = "openai"): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a creative director specializing in video storyboards. Suggest new scene ideas that would enhance the story flow. Respond with JSON in this format: { 'suggestions': string[] }",
        },
        {
          role: "user",
          content: `Project context: ${projectContext}

Existing scenes:
${existingScenes.map((scene, i) => `${i + 1}. ${scene}`).join('\n')}

Suggest 3-5 additional scenes that would improve the story flow, fill gaps, or enhance emotional impact.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.suggestions || [];
  } catch (error) {
    throw new Error("Failed to generate scene suggestions: " + (error as Error).message);
  }
}
