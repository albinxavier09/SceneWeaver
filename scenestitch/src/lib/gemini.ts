import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
console.log('🔑 API Key loaded:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
console.log('🤖 Using Gemini model: gemini-2.5-flash (latest stable)');

if (!apiKey) {
  console.error('❌ GOOGLE_GEMINI_API_KEY is not set in environment variables');
  throw new Error('Google Gemini API key is not configured');
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateSceneDescription(sceneData: {
  title: string;
  description: string;
  dialogue: string;
  technical_details: string;
  status: string;
  tags: string;
  notes: string;
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`
      Generate a detailed scene description for a storyboard based on this scene context:
      
      Scene Title: "${sceneData.title}"
      Current Description: "${sceneData.description || 'None'}"
      Dialogue: "${sceneData.dialogue || 'None'}"
      Technical Details: "${sceneData.technical_details || 'None'}"
      Status: "${sceneData.status}"
      Tags: "${sceneData.tags || 'None'}"
      Notes: "${sceneData.notes || 'None'}"
      
      The description should include:
      • Visual elements (setting, lighting, composition)
      • Character actions and emotions
      • Camera angles and movement suggestions
      • Mood and atmosphere
      • How it connects to the dialogue and technical requirements
      
      Keep it concise but detailed enough for a storyboard artist to understand.
      If there's already a description, enhance it rather than replacing it completely.
      Use simple bullet points and clear, readable text without markdown formatting.
    `);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating scene description:', error);
    throw new Error('Failed to generate scene description');
  }
}

export async function generateDialogue(sceneData: {
  title: string;
  description: string;
  dialogue: string;
  technical_details: string;
  status: string;
  tags: string;
  notes: string;
}, character: string = 'Main Character', tone: string = 'natural'): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`
      Generate dialogue for a storyboard scene based on this context:
      
      Scene Title: "${sceneData.title}"
      Scene Description: "${sceneData.description || 'None'}"
      Current Dialogue: "${sceneData.dialogue || 'None'}"
      Technical Details: "${sceneData.technical_details || 'None'}"
      Status: "${sceneData.status}"
      Tags: "${sceneData.tags || 'None'}"
      Notes: "${sceneData.notes || 'None'}"
      Character: "${character}"
      Tone: "${tone}"
      
      Generate 2-3 lines of dialogue that:
      • Fit the scene description and technical requirements
      • Match the character and tone
      • Are natural and appropriate for the context
      • Enhance the existing dialogue if any
      • Consider the scene's mood and atmosphere
      
      Format as clear, readable dialogue without markdown or special formatting.
    `);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating dialogue:', error);
    throw new Error('Failed to generate dialogue');
  }
}

export async function generateTechnicalDetails(sceneData: {
  title: string;
  description: string;
  dialogue: string;
  technical_details: string;
  status: string;
  tags: string;
  notes: string;
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`
      Generate technical details for a storyboard scene based on this context:
      
      Scene Title: "${sceneData.title}"
      Scene Description: "${sceneData.description || 'None'}"
      Dialogue: "${sceneData.dialogue || 'None'}"
      Current Technical Details: "${sceneData.technical_details || 'None'}"
      Status: "${sceneData.status}"
      Tags: "${sceneData.tags || 'None'}"
      Notes: "${sceneData.notes || 'None'}"
      
      Include technical details for:
      • Camera angle and movement (based on the description and dialogue)
      • Lighting setup (matching the mood and atmosphere)
      • Audio considerations (dialogue, sound effects, music)
      • Transition to next scene (smooth flow)
      • Special effects or technical requirements
      • Props and set design considerations
      • Character positioning and blocking
      
      Format as a simple bulleted list for easy reading.
      If there are existing technical details, enhance them rather than replacing completely.
      Use clear, readable text without markdown formatting.
    `);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating technical details:', error);
    throw new Error('Failed to generate technical details');
  }
}

export async function generateImagePrompt(sceneDescription: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`
      Generate a detailed image generation prompt for a storyboard sketch based on this scene description: "${sceneDescription}"
      
      The prompt should be:
      - Detailed and specific for visual generation
      - Include style references (e.g., "storyboard style", "black and white sketch")
      - Mention composition, lighting, and mood
      - Be suitable for AI image generation tools
      
      Keep it under 200 words but very descriptive.
    `);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating image prompt:', error);
    throw new Error('Failed to generate image prompt');
  }
}

export async function suggestSceneImprovements(sceneData: {
  title: string;
  description: string;
  dialogue: string;
  technical_details: string;
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`
      Review this storyboard scene and suggest improvements:
      
      Title: ${sceneData.title}
      Description: ${sceneData.description}
      Dialogue: ${sceneData.dialogue}
      Technical Details: ${sceneData.technical_details}
      
      Provide suggestions for:
      - Visual improvements
      - Dialogue enhancement
      - Technical considerations
      - Story flow and continuity
      
      Be constructive and specific in your feedback.
    `);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating scene improvements:', error);
    throw new Error('Failed to generate scene improvements');
  }
}

export async function checkContinuity(scenes: Array<{
  title: string;
  description: string;
  dialogue: string;
  technical_details: string;
}>): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const scenesText = scenes.map((scene, index) => 
      `Scene ${index + 1}: ${scene.title}\nDescription: ${scene.description}\nDialogue: ${scene.dialogue}\nTechnical: ${scene.technical_details}`
    ).join('\n\n');
    
    const result = await model.generateContent(`
      Review these storyboard scenes for continuity issues:
      
      ${scenesText}
      
      Check for:
      - Character consistency
      - Setting continuity
      - Timeline consistency
      - Dialogue flow
      - Visual continuity
      - Technical consistency
      
      Identify any issues and suggest fixes.
    `);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error checking continuity:', error);
    throw new Error('Failed to check continuity');
  }
}
