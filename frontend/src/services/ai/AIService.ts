import { database } from '../../lib/firebase';
import { ref, get } from 'firebase/database';
import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_API_KEY' });

export interface AIOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Core AI generation function that handles retries and error reporting
 */
async function generateWithRetry(prompt: string, systemInstruction?: string, options?: AIOptions, retries = 3): Promise<string> {
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is not set in the environment variables.");
    throw new Error("AI functionality is currently unavailable due to missing configuration.");
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 4000,
        }
      });
      
      if (!response.text) {
        throw new Error("Empty response from AI");
      }
      
      return response.text;
    } catch (error: any) {
      console.warn(`AI generation attempt ${attempt} failed:`, error);
      if (error?.status === 429) {
          // Rate limit handling: double the wait time
          await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
          continue;
      }
      if (attempt === retries) {
        throw new Error("AI service is currently unavailable. Please try again later.");
      }
      // Simple exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  throw new Error("AI request failed");
}

/**
 * Extracts JSON from a markdown string containing code blocks
 */
function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (err) {
        console.error("Failed to parse extracted JSON:", match[1]);
        throw new Error("AI returned malformed data format.");
      }
    }
    console.error("Failed to parse AI response as JSON:", text);
    throw new Error("AI did not return valid JSON data.");
  }
}

export class AIService {
  // =====================================
  // SALES INSIGHTS
  // =====================================

  async suggestProducts(customerId: string): Promise<any[]> {
    const ordersSnap = await get(ref(database, 'sales_orders'));
    if (!ordersSnap.exists()) return [];

    const productCounts: Record<string, number> = {};
    ordersSnap.forEach((child) => {
      const order = child.val();
      if (order.customerId === customerId && order.items) {
        order.items.forEach((item: any) => {
          productCounts[item.productId] = (productCounts[item.productId] || 0) + Number(item.qty);
        });
      }
    });

    const productsSnap = await get(ref(database, 'sales_products'));
    const allProducts: any[] = [];
    if (productsSnap.exists()) {
      productsSnap.forEach(p => allProducts.push(p.val()));
    }

    const prompt = `
      Customer History: ${JSON.stringify(productCounts)}
      Available Products: ${JSON.stringify(allProducts)}
      Task: Analyze the customer's purchase history and recommend exactly 3 products they are most likely to buy next.
      Return a JSON array of product objects (matching the structure from Available Products).
    `;

    const response = await generateWithRetry(prompt, "You are a sales prediction AI. Return valid JSON only.");
    return extractJson(response);
  }

  async predictOutstandingPayments(customerId: string): Promise<string> {
    const ordersSnap = await get(ref(database, 'sales_orders'));
    if (!ordersSnap.exists()) return "No data";

    const customerOrders: any[] = [];
    ordersSnap.forEach((child) => {
      const order = child.val();
      if (order.customerId === customerId) {
          customerOrders.push(order);
      }
    });

    const prompt = `
      Customer Orders: ${JSON.stringify(customerOrders)}
      Task: Analyze this customer's payment behavior. Predict the most likely payment date for their latest unpaid order.
      Return a short predictive sentence (e.g. "Predicted Payment Date: YYYY-MM-DD").
      Return JSON: { "prediction": "sentence" }
    `;

    try {
        const response = await generateWithRetry(prompt, "You are a financial analyst AI. Return valid JSON only.");
        return extractJson(response).prediction;
    } catch {
        return "Prediction unavailable.";
    }
  }

  async generateDailySummary(): Promise<string> {
    const ordersSnap = await get(ref(database, 'sales_orders'));
    const today = new Date().toISOString().split('T')[0];
    const todayOrders: any[] = [];

    if (ordersSnap.exists()) {
      ordersSnap.forEach((child) => {
        const order = child.val();
        if (order.date && order.date.startsWith(today)) {
          todayOrders.push(order);
        }
      });
    }

    const prompt = `
      Today's Orders: ${JSON.stringify(todayOrders)}
      Task: Write a concise, executive 1-sentence daily summary of sales performance.
      Return JSON: { "summary": "sentence" }
    `;

    try {
      const response = await generateWithRetry(prompt, "You are a business intelligence AI. Return valid JSON only.");
      return extractJson(response).summary;
    } catch {
      return "Daily summary generation failed.";
    }
  }

  // =====================================
  // INVENTORY INSIGHTS
  // =====================================

  async predictLowStock(): Promise<any[]> {
    const movSnap = await get(ref(database, 'inventory_movements'));
    const movements: any[] = [];
    
    if (movSnap.exists()) {
      movSnap.forEach(child => movements.push(child.val()));
    }

    const prompt = `
      Recent Inventory Movements: ${JSON.stringify(movements.slice(-100))}
      Task: Identify stock lots that will run out within 7 days based on dispatch velocity.
      Return JSON array of objects: [{ "key": "roomId_stockLotId", "currentStock": 10, "daysRemaining": 5, "velocity": "2/day" }]
    `;

    try {
      const response = await generateWithRetry(prompt, "You are a supply chain forecasting AI. Return valid JSON only.");
      return extractJson(response);
    } catch {
      return [];
    }
  }

  async suggestTransfers(): Promise<string[]> {
      // Mock logic can remain for structure, but ideally passes data to Gemini
      return ["AI Transfer suggestions require current room capacities. (API update pending)"];
  }

  async detectAbnormalStock(): Promise<string[]> {
      return ["AI Anomaly detection requires full ledger access. (API update pending)"];
  }

  // =====================================
  // MANAGEMENT INSIGHTS
  // =====================================

  async generateBusinessSummary(): Promise<any> {
    return await this.generateDailySummary();
  }

  async detectAnomalies(): Promise<string[]> {
    const ordersSnap = await get(ref(database, 'sales_orders'));
    const orders: any[] = [];
    
    if (ordersSnap.exists()) {
      ordersSnap.forEach((child) => orders.push(child.val()));
    }

    const prompt = `
      Sales Data: ${JSON.stringify(orders.slice(-50))}
      Task: Detect any anomalies in these recent orders (e.g. unusually large amounts).
      Return JSON array of strings, each describing one anomaly found. If none, return empty array.
    `;

    try {
      const response = await generateWithRetry(prompt, "You are a fraud detection and anomaly AI. Return valid JSON only.");
      return extractJson(response);
    } catch {
      return [];
    }
  }
}

export const aiService = new AIService();
