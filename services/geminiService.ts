import { GoogleGenAI, Type } from '@google/genai';
import { AGENTS } from '../constants';
import { AgentId, RoutingResult } from '../types';

// Initialize AI client using the environment variable directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * The "Brain" Logic - Step 1: Routing
 * Decides which agent(s) should handle the request.
 * Now supports breaking a single prompt into MULTIPLE tasks.
 */
export const routeRequest = async (userPrompt: string): Promise<RoutingResult> => {
  const model = 'gemini-2.5-flash';

  const routerSystemPrompt = `
    You are the Master Router AI for 'Jarvis Hub'.
    Your task is to analyze the user's input and break it down into one or more execution tasks.
    
    Routing Rules:
    - SOCIAL: Keywords like post, tweet, instagram, caption, hashtag, viral, or social media analysis.
    - HR: Keywords like hiring, firing, policy, employee, leave, contract, workplace.
    - EMAIL: Keywords like email, draft, reply, summarize thread, inbox.
    - DESIGNER: Keywords like generate image, create a picture, draw, design logo, illustrate.
    - CODEX: Keywords like code, script, html, css, javascript, react, python, debug, app, website.
    - MASTER: General greetings, complex reasoning not fitting the above, or unclear intents.

    If the user asks for multiple things (e.g., "Create a logo AND write a tweet"), you MUST return a list of tasks in logical order.
    For 'specificInstruction', extract ONLY the part of the prompt relevant to that agent.

    Output must be a strictly valid JSON object containing a 'tasks' array.
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
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ['SOCIAL', 'HR', 'EMAIL', 'DESIGNER', 'CODEX', 'MASTER'] },
                  reasoning: { type: Type.STRING, description: "Short explanation." },
                  specificInstruction: { type: Type.STRING, description: "The specific sub-prompt for this agent." }
                },
                required: ['category', 'reasoning', 'specificInstruction']
              }
            }
          }
        }
      }
    });

    const jsonText = response.text || "{\"tasks\": []}";
    const result = JSON.parse(jsonText);

    const tasks = result.tasks.map((t: any) => {
        let targetAgentId = AgentId.MASTER;
        switch (t.category) {
          case 'SOCIAL': targetAgentId = AgentId.SOCIAL; break;
          case 'HR': targetAgentId = AgentId.HR; break;
          case 'EMAIL': targetAgentId = AgentId.EMAIL; break;
          case 'DESIGNER': targetAgentId = AgentId.DESIGNER; break;
          case 'CODEX': targetAgentId = AgentId.CODEX; break;
          default: targetAgentId = AgentId.MASTER;
        }
        return {
            targetAgentId,
            reasoning: t.reasoning,
            specificInstruction: t.specificInstruction || userPrompt
        };
    });

    if (tasks.length === 0) {
        return { tasks: [{ targetAgentId: AgentId.MASTER, reasoning: "Default", specificInstruction: userPrompt }]};
    }

    return { tasks };

  } catch (error) {
    console.error("Routing Error:", error);
    // Fallback to Master if routing fails
    return { 
        tasks: [{ 
            targetAgentId: AgentId.MASTER, 
            reasoning: "Error in routing logic, defaulting to Master.", 
            specificInstruction: userPrompt 
        }] 
    };
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