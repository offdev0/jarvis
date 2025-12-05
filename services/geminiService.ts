import { GoogleGenAI, Type } from '@google/genai';
import { AGENTS } from '../constants';
import { AgentId, RoutingResult } from '../types';

// Safely access API key to prevent "process is not defined" crashes in pure browser environments
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error
  }
  return '';
};

const apiKey = getApiKey();
if (!apiKey) {
  console.error("API_KEY is missing. The app will fail to generate content.");
}

// Initialize AI only if key exists to prevent immediate constructor error, 
// though we handle errors in functions.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * The "Brain" Logic - Step 1: Routing
 * Decides which agent should handle the request based on keywords and context.
 */
export const routeRequest = async (userPrompt: string): Promise<RoutingResult> => {
  if (!ai) return { targetAgentId: AgentId.MASTER, reasoning: "API Key missing" };

  const model = 'gemini-2.5-flash';

  const routerSystemPrompt = `
    You are the Master Router AI for 'Jarvis Hub'.
    Your task is to analyze the user's input and route it to the correct specialized agent.
    
    Routing Rules:
    - Route to 'SOCIAL' if the input contains keywords like: post, tweet, instagram, caption, hashtag, viral, or requests to analyze uploaded visuals for social media.
    - Route to 'HR' if the input contains keywords like: hiring, firing, policy, employee, leave, contract, workplace, or corporate letters.
    - Route to 'EMAIL' if the input contains keywords like: email, draft, reply, summarize thread, inbox, or professional communication.
    - Route to 'DESIGNER' if the input contains keywords like: generate image, create a picture, draw, design a logo, paint, illustrate, or visualize.
    - Route to 'CODEX' if the input contains keywords like: code, write a script, html, css, javascript, react, python, function, debug, compile, app, website, component.
    - Route to 'MASTER' for general greetings, complex reasoning not fitting the above, or unclear intents.

    Output must be a strictly valid JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: routerSystemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ['SOCIAL', 'HR', 'EMAIL', 'DESIGNER', 'CODEX', 'MASTER'] },
            reasoning: { type: Type.STRING, description: "Short explanation of why this agent was chosen." }
          },
          required: ['category', 'reasoning']
        }
      }
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText);

    let targetAgentId = AgentId.MASTER;
    switch (result.category) {
      case 'SOCIAL': targetAgentId = AgentId.SOCIAL; break;
      case 'HR': targetAgentId = AgentId.HR; break;
      case 'EMAIL': targetAgentId = AgentId.EMAIL; break;
      case 'DESIGNER': targetAgentId = AgentId.DESIGNER; break;
      case 'CODEX': targetAgentId = AgentId.CODEX; break;
      default: targetAgentId = AgentId.MASTER;
    }

    return {
      targetAgentId,
      reasoning: result.reasoning
    };

  } catch (error) {
    console.error("Routing Error:", error);
    // Fallback to Master if routing fails
    return { targetAgentId: AgentId.MASTER, reasoning: "Error in routing logic, defaulting to Master." };
  }
};

/**
 * The "Brain" Logic - Step 2: Execution
 * Generates the response using the specific agent's persona.
 * Returns both text and optional generated image.
 */
export const generateAgentResponse = async (
  agentId: AgentId,
  userPrompt: string,
  base64Image?: string,
  mimeType?: string
): Promise<{ text: string; generatedImageUrl?: string }> => {
  if (!ai) return { text: "System Error: API Configuration Invalid." };

  const agentConfig = AGENTS[agentId];
  
  // Decide which model to use
  // DESIGNER uses gemini-2.5-flash-image for generation.
  // Others use gemini-2.5-flash for text/multimodal analysis.
  const isDesigner = agentId === AgentId.DESIGNER;
  const model = isDesigner ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash';

  const parts: any[] = [{ text: userPrompt }];
  
  // Attach uploaded image if provided (e.g. for Social Media analysis)
  // Note: gemini-2.5-flash-image also supports input images for editing, but we focus on generation here.
  if (base64Image && mimeType) {
    parts.unshift({
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        // Inject persona
        systemInstruction: agentConfig.systemInstruction,
        // DESIGNER specific config
        ...(isDesigner ? {
          imageConfig: {
             aspectRatio: "1:1",
             // numberOfImages: 1 // Default
          }
        } : {
           temperature: 0.7
        })
      }
    });

    let textResponse = "";
    let generatedImageUrl = undefined;

    // Parse response based on model type
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          textResponse += part.text;
        } else if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const mime = part.inlineData.mimeType || 'image/png';
          generatedImageUrl = `data:${mime};base64,${base64Data}`;
        }
      }
    } else if (response.text) {
       textResponse = response.text;
    }

    if (!textResponse && !generatedImageUrl) {
      textResponse = "I processed the request but generated no output.";
    }

    return { text: textResponse, generatedImageUrl };

  } catch (error) {
    console.error(`Error generating response for ${agentConfig.name}:`, error);
    return { text: `System Error: Unable to connect to the ${agentConfig.name} neural net.` };
  }
};