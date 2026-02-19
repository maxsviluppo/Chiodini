
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { Peg, COLORS } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class AIService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env['API_KEY'] || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generatePattern(levelName: string, gridSize: number): Promise<Peg[]> {
    try {
      const colorNames = COLORS.map(c => c.name).join(', ');
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a simple mosaic pattern for a 3D peg game. 
          The grid is ${gridSize}x${gridSize}. 
          Pegs cover a 3x3 area, but are placed in a single center hole. 
          Generate a pattern for "${levelName}". 
          Use these colors: ${colorNames}. 
          Each peg needs an x and y coordinate (0 to ${gridSize - 1}) and a color hex.
          Space the pegs out so they don't overlap (minimum distance between centers should be 3 units).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.INTEGER },
                y: { type: Type.INTEGER },
                colorHex: { type: Type.STRING }
              },
              required: ["x", "y", "colorHex"]
            }
          }
        }
      });

      const raw = JSON.parse(response.text || '[]');
      return raw.map((item: any, idx: number) => ({
        id: `target-${idx}`,
        x: item.x,
        y: item.y,
        color: item.colorHex
      }));
    } catch (error) {
      console.error("AI Pattern generation failed", error);
      return []; // Fallback
    }
  }
}
