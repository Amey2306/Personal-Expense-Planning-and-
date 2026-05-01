import { GoogleGenAI, Type } from "@google/genai";

// Ensure the API key is picked up from Vite's env processing
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Transaction {
  date: string;
  description: string;
  merchant: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

export interface StatementData {
  transactions: Transaction[];
  insights: string[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    savingsOpportunities: number;
  };
}

export async function processStatement(
  fileContent: string | null,
  mimeType: string,
  textData: string | null
): Promise<StatementData> {
  const prompt = `Analyze this bank statement. Extract all individual transactions. 
Clean up the merchant names from raw bank text. 
Categorize the expenses (e.g., 'Housing', 'Food & Dining', 'Transportation', 'Utilities', 'Shopping', 'Entertainment', 'Subscriptions', 'Healthcare', 'Income', 'Other').
Generate actionable insights on specifically where and how the user can save money given their spending habits.
Calculate the total income, total expenses, and an estimated amount of realistic savings they could make based on discretionary spending.`;

  const contents: any[] = [];
  
  if (textData) {
    contents.push({ text: prompt + "\n\nStatement Data (CSV/Text):\n" + textData });
  } else if (fileContent) {
    contents.push({
      parts: [
        { text: prompt },
        {
          inlineData: {
            data: fileContent,
            mimeType: mimeType,
          },
        },
      ],
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transactions: {
            type: Type.ARRAY,
            description: "List of transactions extracted from the statement",
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "Date of transaction in YYYY-MM-DD format" },
                description: { type: Type.STRING, description: "Original description or narrative" },
                merchant: { type: Type.STRING, description: "Cleaned up merchant or entity name" },
                amount: { type: Type.NUMBER, description: "Absolute amount of the transaction" },
                type: { type: Type.STRING, description: "Either 'income' or 'expense'" },
                category: { type: Type.STRING, description: "Category like 'Housing', 'Food', etc." },
              },
              required: ["date", "description", "merchant", "amount", "type", "category"]
            }
          },
          insights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Actionable financial insights and specific suggestions on where money could be saved based on the transactions."
          },
          summary: {
            type: Type.OBJECT,
            properties: {
              totalIncome: { type: Type.NUMBER },
              totalExpense: { type: Type.NUMBER },
              savingsOpportunities: { type: Type.NUMBER, description: "Estimated amount that could easily be saved based on discretionary spending." }
            },
            required: ["totalIncome", "totalExpense", "savingsOpportunities"]
          }
        },
        required: ["transactions", "insights", "summary"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response received from Gemini.");
  }

  try {
    return JSON.parse(text) as StatementData;
  } catch (err) {
    throw new Error("Failed to parse Gemini response as JSON.");
  }
}
