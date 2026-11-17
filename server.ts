import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleAiError(res: Response, error: unknown, context: string) {
  console.error(`[Gemini API Error - ${context}]`, error);
  const message =
    error instanceof Error ? error.message : 'An unexpected AI service error occurred.';
  const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
  res.status(status).json({ error: message });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // 1. Generate professional listing description in EN / FR / AR
  app.post('/api/ai/description', async (req: Request, res: Response) => {
    try {
      const { property, language = 'en' } = req.body as {
        property: Record<string, unknown>;
        language?: 'en' | 'fr' | 'ar';
      };
      if (!property) {
        res.status(400).json({ error: 'Property details are required.' });
        return;
      }

      const langLabel =
        language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English';

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Write a compelling, accurate Dubai real estate listing description in ${langLabel} for the following property. Use concrete architectural, lifestyle, and neighborhood details without clichés or markdown bullet clutter. Keep it between 110 and 170 words in 2 concise paragraphs.\n\nProperty data:\n${JSON.stringify(property, null, 2)}`,
        config: {
          systemInstruction:
            'You are a senior Dubai luxury and residential real estate copywriter for Harbour & Crest Dubai. Produce clear, accurate, persuasive property copy grounded strictly in the provided features.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      res.json({ description: (response.text ?? '').trim() });
    } catch (error) {
      handleAiError(res, error, 'description');
    }
  });

  // 2. Smart natural-language property search
  app.post('/api/ai/smart-search', async (req: Request, res: Response) => {
    try {
      const { query, availableCommunities = [] } = req.body as {
        query: string;
        availableCommunities?: string[];
      };
      if (!query || !query.trim()) {
        res.status(400).json({ error: 'Search query is required.' });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Parse this Dubai real estate search query into structured filter criteria.\nQuery: "${query}"\nKnown Dubai communities in our catalog: ${availableCommunities.join(', ')}.\n\nNotes on pricing: Dubai properties in our database store sale prices in AED (e.g. 1,500,000 - 35,000,000 AED) and monthly rents in AED (e.g. 6,500 - 85,000 AED/month). If the user specifies a low monthly budget like "under 1500" in EUR/USD or "under 15000 AED", infer realistic AED equivalents (1 USD ≈ 3.67 AED, 1 EUR ≈ 4.0 AED).`,
        config: {
          systemInstruction:
            'You translate natural language Dubai real estate queries into clean structured filter parameters.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transactionType: {
                type: Type.STRING,
                description: 'Either "all", "sale", or "rent"',
              },
              propertyType: {
                type: Type.STRING,
                description:
                  'One of "all", "apartment", "villa", "house", "land", "office", "commercial"',
              },
              community: {
                type: Type.STRING,
                description:
                  'Matching community name from the known list, or empty string if unspecified',
              },
              minBedrooms: {
                type: Type.INTEGER,
                description: 'Minimum bedrooms requested, or 0 if unspecified',
              },
              maxPriceAed: {
                type: Type.NUMBER,
                description:
                  'Maximum price (for sale) or maximum monthly rent (for rent) in AED, or 0 if unspecified',
              },
              furnished: {
                type: Type.BOOLEAN,
                description: 'True only if user explicitly requests furnished',
              },
              pool: {
                type: Type.BOOLEAN,
                description: 'True only if user explicitly requests a pool',
              },
              nearSea: {
                type: Type.BOOLEAN,
                description: 'True if user asks for waterfront, beach, marina, or near the sea',
              },
              keywords: {
                type: Type.STRING,
                description: 'Any remaining search keywords or empty string',
              },
              summary: {
                type: Type.STRING,
                description: 'Short 1-sentence human explanation of how the query was interpreted',
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error) {
      handleAiError(res, error, 'smart-search');
    }
  });

  // 3. Price estimation based on comparable properties in the dataset
  app.post('/api/ai/price-estimate', async (req: Request, res: Response) => {
    try {
      const { target, comparables = [] } = req.body as {
        target: Record<string, unknown>;
        comparables: Record<string, unknown>[];
      };
      if (!target) {
        res.status(400).json({ error: 'Target property specifications are required.' });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Estimate the fair Dubai market sale price and monthly rent (in AED) for the target property strictly grounded in the provided comparable properties from our agency portfolio.\n\nTarget Property:\n${JSON.stringify(target, null, 2)}\n\nComparable Portfolio Properties:\n${JSON.stringify(comparables, null, 2)}`,
        config: {
          systemInstruction:
            'You are a RERA-certified Dubai property valuation analyst. Compute realistic AED valuations grounded in the comparable listings provided.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedSaleAed: {
                type: Type.NUMBER,
                description: 'Recommended sale price in AED',
              },
              saleRangeMinAed: {
                type: Type.NUMBER,
                description: 'Lower bound sale estimate in AED',
              },
              saleRangeMaxAed: {
                type: Type.NUMBER,
                description: 'Upper bound sale estimate in AED',
              },
              estimatedMonthlyRentAed: {
                type: Type.NUMBER,
                description: 'Recommended monthly rent in AED',
              },
              pricePerSqmAed: {
                type: Type.NUMBER,
                description: 'Estimated AED per square meter',
              },
              grossYieldPct: {
                type: Type.NUMBER,
                description: 'Estimated annual gross rental yield percentage',
              },
              rationale: {
                type: Type.STRING,
                description: 'Concise 2-3 sentence valuation rationale referencing comparables',
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error) {
      handleAiError(res, error, 'price-estimate');
    }
  });

  // 4. Draft client inquiry reply
  app.post('/api/ai/draft-reply', async (req: Request, res: Response) => {
    try {
      const { inquiry, property, agentName = 'Harbour & Crest Advisory Team', language = 'en' } =
        req.body as {
          inquiry: { name: string; message: string };
          property?: Record<string, unknown>;
          agentName?: string;
          language?: 'en' | 'fr' | 'ar';
        };

      if (!inquiry?.message) {
        res.status(400).json({ error: 'Inquiry message is required.' });
        return;
      }

      const langLabel =
        language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English';

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Draft a courteous, concrete email reply in ${langLabel} from broker ${agentName} at Harbour & Crest Dubai.\n\nClient Name: ${inquiry.name}\nClient Inquiry: "${inquiry.message}"\n\nRelated Property:\n${property ? JSON.stringify(property, null, 2) : 'General brokerage inquiry'}\n\nInclude next steps to schedule a private viewing or provide floor plans/Ejari/DLD details. Keep it concise and ready to send.`,
        config: {
          systemInstruction:
            'You are a professional Dubai real estate broker writing direct, helpful client responses.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      res.json({ reply: (response.text ?? '').trim() });
    } catch (error) {
      handleAiError(res, error, 'draft-reply');
    }
  });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Harbour & Crest Dubai server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
