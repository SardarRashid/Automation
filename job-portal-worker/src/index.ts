import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GoogleGenAI, Type } from '@google/genai';

type Bindings = {
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const GEMINI_MODEL = 'gemini-flash-lite-latest';

// Enable CORS for all routes
app.use('/*', cors({
  origin: '*', // Allows requests from any origin. Can be restricted to frontend URL in prod.
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

app.get("/api/models", async (c) => {
  try {
    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.list();
    return c.json(response);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
});

app.get("/api/test-models", async (c) => {
  const modelsToTest = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash',
    'gemini-3.5-flash'
  ];
  const ai = getGeminiClient(c.env.GEMINI_API_KEY);
  let results: any = {};
  
  for (const model of modelsToTest) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ text: "hi" }],
      });
      results[model] = "SUCCESS";
      return c.json({ workingModel: model, results }); // Return immediately on first success
    } catch (error: any) {
      results[model] = error?.message || "Error";
    }
  }
  return c.json({ error: "No working models found", results });
});

// Basic rate limiting middleware placeholder
const apiLimiter = async (c: any, next: any) => {
  // Cloudflare Workers natively handle DDOS, but specific IP limits require Durable Objects or KV.
  // For now, we pass through.
  await next();
};

// Simplified Firebase Token Verification using Web Crypto API
// In production, this should fetch Google's public keys. For this migration, we check presence.
const verifyFirebaseToken = async (c: any, next: any) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid Authorization header" }, 401);
  }
  const token = authHeader.split("Bearer ")[1];
  
  // Basic token structure check (Firebase JWTs have 3 parts)
  if (token.split('.').length !== 3) {
    return c.json({ error: "Forbidden: Invalid token structure" }, 403);
  }
  
  // Optional: Full RS256 signature verification can be added here using Web Crypto
  c.set('userToken', token);
  await next();
};

function getGeminiClient(apiKey: string): GoogleGenAI {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in Cloudflare Worker bindings.");
  }
  return new GoogleGenAI({ apiKey });
}

// Definition of response schemas to enforce structured outputs via Gemini
const tailorCvSchema = {
  type: Type.OBJECT,
  properties: {
    matchScore: { type: Type.INTEGER },
    successScore: { type: Type.INTEGER },
    analysis: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["strengths", "gaps"]
    },
    keyChanges: { type: Type.ARRAY, items: { type: Type.STRING } },
    tailoredCv: { type: Type.STRING, description: "String in Markdown format containing the customized resume" },
    coverLetter: { type: Type.STRING, description: "String in Markdown format containing the customized cover letter" },
    screeningQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING }
        },
        required: ["question", "answer"]
      }
    },
    authenticity: {
      type: Type.OBJECT,
      properties: {
        rating: { type: Type.STRING },
        reason: { type: Type.STRING }
      },
      required: ["rating", "reason"]
    },
    interviewPrediction: {
      type: Type.OBJECT,
      properties: {
        chance: { type: Type.STRING },
        probability: { type: Type.INTEGER },
        breakdown: { type: Type.STRING }
      },
      required: ["chance", "probability", "breakdown"]
    },
    skillGaps: {
      type: Type.OBJECT,
      properties: {
        missing: { type: Type.ARRAY, items: { type: Type.STRING } },
        certs: { type: Type.ARRAY, items: { type: Type.STRING } },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["missing", "certs", "keywords", "suggestions"]
    },
    portfolioEntries: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          deliverables: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "description", "deliverables"]
      }
    },
    countryRulesApplied: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: [
    "matchScore",
    "successScore",
    "analysis",
    "keyChanges",
    "tailoredCv",
    "coverLetter",
    "screeningQuestions",
    "authenticity",
    "interviewPrediction",
    "skillGaps",
    "portfolioEntries",
    "countryRulesApplied"
  ]
};

const scanCompanySiteSchema = {
  type: Type.OBJECT,
  properties: {
    companyName: { type: Type.STRING },
    website: { type: Type.STRING },
    openPositions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          department: { type: Type.STRING },
          location: { type: Type.STRING },
          country: { type: Type.STRING },
          requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
          description: { type: Type.STRING }
        },
        required: ["title", "department", "location", "country", "requirements", "description"]
      }
    },
    customFormRequirements: { type: Type.STRING },
    specialRequirementsDetected: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["companyName", "website", "openPositions", "customFormRequirements", "specialRequirementsDetected"]
};

const scanEmailsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      sender: { type: Type.STRING },
      subject: { type: Type.STRING },
      date: { type: Type.STRING },
      snippet: { type: Type.STRING },
      companyName: { type: Type.STRING },
      sentiment: { type: Type.STRING },
      statusChange: { type: Type.STRING },
      summary: { type: Type.STRING },
      actionRequired: { type: Type.STRING },
      rejectionFeedback: { type: Type.STRING },
      rejectionPattern: { type: Type.STRING }
    },
    required: [
      "id",
      "sender",
      "subject",
      "date",
      "snippet",
      "sentiment",
      "statusChange",
      "summary",
      "actionRequired"
    ]
  }
};

const generateCvVariantSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING },
    cvText: { type: Type.STRING },
    optimizedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING }
  },
  required: ["category", "cvText", "optimizedSkills", "summary"]
};

const triggerAutomationCycleSchema = {
  type: Type.OBJECT,
  properties: {
    cycleSummary: { type: Type.STRING },
    logs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING },
          level: { type: Type.STRING },
          message: { type: Type.STRING }
        },
        required: ["timestamp", "level", "message"]
      }
    },
    discoveredJobs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          jobTitle: { type: Type.STRING },
          jobUrl: { type: Type.STRING },
          location: { type: Type.STRING },
          country: { type: Type.STRING },
          category: { type: Type.STRING },
          description: { type: Type.STRING },
          successScore: { type: Type.INTEGER },
          authenticity: {
            type: Type.OBJECT,
            properties: {
              rating: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["rating", "reason"]
          },
          interviewPrediction: {
            type: Type.OBJECT,
            properties: {
              chance: { type: Type.STRING },
              probability: { type: Type.INTEGER },
              breakdown: { type: Type.STRING }
            },
            required: ["chance", "probability", "breakdown"]
          },
          appliedAction: { type: Type.STRING },
          reason: { type: Type.STRING }
        },
        required: [
          "companyName",
          "jobTitle",
          "jobUrl",
          "location",
          "country",
          "category",
          "description",
          "successScore",
          "authenticity",
          "interviewPrediction",
          "appliedAction",
          "reason"
        ]
      }
    },
    learnedAdjustments: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["cycleSummary", "logs", "discoveredJobs", "learnedAdjustments"]
};

const draftHrReplySchema = {
  type: Type.OBJECT,
  properties: {
    draftedReply: { type: Type.STRING },
    safetyAudits: { type: Type.ARRAY, items: { type: Type.STRING } },
    safetyScore: { type: Type.INTEGER }
  },
  required: ["draftedReply", "safetyAudits", "safetyScore"]
};

const parseCvSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    email: { type: Type.STRING },
    phone: { type: Type.STRING },
    summary: { type: Type.STRING },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          company: { type: Type.STRING },
          duration: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["title", "company", "duration", "description"]
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          school: { type: Type.STRING },
          degree: { type: Type.STRING },
          duration: { type: Type.STRING }
        },
        required: ["school", "degree", "duration"]
      }
    },
    certificates: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingFields: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: [
    "name",
    "email",
    "phone",
    "summary",
    "skills",
    "experience",
    "education",
    "certificates",
    "missingFields"
  ]
};

const generateAiCvSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    summary: { type: Type.STRING },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          company: { type: Type.STRING },
          duration: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["title", "company", "duration", "description"]
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          school: { type: Type.STRING },
          degree: { type: Type.STRING },
          duration: { type: Type.STRING }
        },
        required: ["school", "degree", "duration"]
      }
    },
    certificates: { type: Type.ARRAY, items: { type: Type.STRING } },
    masterCvText: { type: Type.STRING }
  },
  required: [
    "name",
    "summary",
    "skills",
    "experience",
    "education",
    "certificates",
    "masterCvText"
  ]
};

const importLinkedinSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    headline: { type: Type.STRING },
    summary: { type: Type.STRING },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          company: { type: Type.STRING },
          duration: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["title", "company", "duration", "description"]
      }
    },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          school: { type: Type.STRING },
          degree: { type: Type.STRING },
          duration: { type: Type.STRING }
        },
        required: ["school", "degree", "duration"]
      }
    },
    certificates: { type: Type.ARRAY, items: { type: Type.STRING } },
    isIncomplete: { type: Type.BOOLEAN },
    missingFields: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: [
    "name",
    "headline",
    "summary",
    "experience",
    "skills",
    "education",
    "certificates",
    "isIncomplete",
    "missingFields"
  ]
};

const generateFullProfileSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    email: { type: Type.STRING },
    phone: { type: Type.STRING },
    summary: { type: Type.STRING },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          company: { type: Type.STRING },
          duration: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["title", "company", "duration", "description"]
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          school: { type: Type.STRING },
          degree: { type: Type.STRING },
          duration: { type: Type.STRING }
        },
        required: ["school", "degree", "duration"]
      }
    },
    certificates: { type: Type.ARRAY, items: { type: Type.STRING } },
    masterCvText: { type: Type.STRING }
  },
  required: [
    "name",
    "email",
    "phone",
    "summary",
    "skills",
    "experience",
    "education",
    "certificates",
    "masterCvText"
  ]
};

const generateProfileAiSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    email: { type: Type.STRING },
    phone: { type: Type.STRING },
    summary: { type: Type.STRING },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          company: { type: Type.STRING },
          duration: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["title", "company", "duration", "description"]
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          school: { type: Type.STRING },
          degree: { type: Type.STRING },
          duration: { type: Type.STRING }
        },
        required: ["school", "degree", "duration"]
      }
    },
    certificates: { type: Type.ARRAY, items: { type: Type.STRING } },
    masterCvText: { type: Type.STRING },
    identifiedMissingGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
    careerPathSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: [
    "name",
    "email",
    "phone",
    "summary",
    "skills",
    "experience",
    "education",
    "certificates",
    "masterCvText",
    "identifiedMissingGaps",
    "careerPathSuggestions"
  ]
};

// Helper to safely parse JSON strings that might contain raw newlines or unescaped characters from LLM outputs
function safeJsonParse(text: string): any {
  let cleaned = text.trim();
  
  // Remove markdown code fence wrappers if the model returned them
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.warn("Primary JSON parse failed, attempting healing. Error:", err.message);
    
    // Find first '{' or '[' and last '}' or ']' to isolate the JSON content
    const startObj = cleaned.indexOf("{");
    const startArr = cleaned.indexOf("[");
    let startIndex = -1;
    let endIndex = -1;

    if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
      startIndex = startObj;
      endIndex = cleaned.lastIndexOf("}");
    } else if (startArr !== -1) {
      startIndex = startArr;
      endIndex = cleaned.lastIndexOf("]");
    }

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    }

    // Try to heal raw unescaped newlines inside quotes.
    // We scan character by character to find raw newlines inside string literals.
    let inString = false;
    let escaped = false;
    let healedChars: string[] = [];

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      
      if (inString) {
        if (char === '\n') {
          healedChars.push('\\n');
          continue;
        }
        if (char === '\r') {
          healedChars.push('\\r');
          continue;
        }
        if (char === '\t') {
          healedChars.push('\\t');
          continue;
        }
      }
      
      escaped = (char === '\\' && !escaped);
      healedChars.push(char);
    }
    
    let healed = healedChars.join("");
    
    // Remove trailing commas before closing braces/brackets
    healed = healed.replace(/,\s*([\]}])/g, "$1");

    try {
      return JSON.parse(healed);
    } catch (err2: any) {
      console.error("Healed JSON parse failed as well. Error:", err2.message);
      console.error("Final processed text attempted to parse:", healed);
      throw new Error(`JSON Syntax Error in LLM Response: ${err2.message}`);
    }
  }
}



  // API endpoint for tailoring CV and generating full automation reports
  app.post("/api/tailor-cv", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { masterCv, linkedIn, jobDescription, jobTitle, companyName, extraInstructions, country, category, candidateName } = body;

      if (!masterCv && !linkedIn) {
        return c.json({ error: "Please provide either your CV or your LinkedIn profile details." }, 400);
      }
      if (!jobDescription) {
        return c.json({ error: "Please provide a target job description." }, 400);
      }

      const ai = getGeminiClient(c.env.GEMINI_API_KEY);

      const prompt = `
You are ${body.candidateName || body.profile?.name || 'the candidate'}'s elite, hyper-personalized AI Job Automation Agent.
Your task is to analyze the job description for the role of "${jobTitle || 'Target Role'}" at "${companyName || 'Target Company'}" (Target Country: "${country || 'Unspecified'}", Category: "${category || 'General'}"), evaluate ${body.candidateName || body.profile?.name || 'the candidate'}'s profile, detect skill gaps, predict interview chances, check job authenticity, generate project-style portfolio entries if needed, and optimize his CV/Cover Letter.

USER PROFILE DATA:
--- MASTER CV / RESUME ---
${masterCv || '(Not provided)'}

--- LINKEDIN PROFILE INFO ---
${linkedIn || '(Not provided)'}

TARGET JOB DETAILS:
--- JOB TITLE ---
${jobTitle || 'Target Role'}

--- COMPANY ---
${companyName || 'Target Company'}

--- COUNTRY ---
${country || 'Unspecified'}

--- CATEGORY ---
${category || 'General'}

--- JOB DESCRIPTION ---
${jobDescription}

${extraInstructions ? `--- EXTRA USER INSTRUCTIONS ---\n${extraInstructions}` : ''}

COUNTRY-WISE SMART RULES TO APPLY:
- Saudi Arabia: emphasize official certificates, vendor certifications, and structured licensing.
- UAE: emphasize experience keywords, specific toolsets, major project scopes, and regional keywords.
- Qatar: elevate the Cover Letter with highly personalized details about the company's regional contribution.
- Kuwait: place intensive emphasis on core technical and soft skills, and localized responsibilities.

INSTRUCTIONS:
1. Optimize the CV to bypass Applicant Tracking Systems (ATS) by highlighting matching keywords and aligning bullet points. Structure in professional, clean, elegant Markdown.
2. Compute a "Success Score" (0-100) based on CV match, skills alignment, country fit, and authenticity.
3. Conduct a "Job Authenticity Check": evaluate if this job has hallmarks of a fake or scam job (unreasonable pay, vague employer, suspicious application fees, telegram/whatsapp recruiting, etc.) and write a brief safety assessment.
4. Predict "Interview Chance": calculate probability (0-100), label as high/medium/low, and explain.
5. Perform "Skill Gap Detection": compare CV against requirements, identify missing skills, certificates, and keywords, and write a checklist of action items.
6. Generate custom, project-style "Portfolio Entries" (minimum 2 project entries) translating ${body.candidateName || body.profile?.name || 'the candidate'}'s experience into compelling deliverables.
7. Generate a tailored, high-converting Cover Letter matching country-specific rules.
8. Compile likely screening questions (3 items) with strategic answers.

You MUST respond with a valid JSON object matching this structure EXACTLY:
{
  "matchScore": number,
  "successScore": number,
  "analysis": {
    "strengths": ["bullet 1", "bullet 2"],
    "gaps": ["bullet 1", "bullet 2"]
  },
  "keyChanges": ["bullet 1", "bullet 2"],
  "tailoredCv": "string in Markdown format containing the customized resume",
  "coverLetter": "string in Markdown format containing the customized cover letter",
  "screeningQuestions": [
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "authenticity": {
    "rating": "safe" | "suspicious",
    "reason": "string explaining authenticity rating"
  },
  "interviewPrediction": {
    "chance": "high" | "medium" | "low",
    "probability": number,
    "breakdown": "string explaining prediction breakdown"
  },
  "skillGaps": {
    "missing": ["missing skill/qualification 1", "missing skill 2"],
    "certs": ["suggested certificate/training 1", "suggested training 2"],
    "keywords": ["ATS keyword 1", "ATS keyword 2"],
    "suggestions": ["suggested CV addition or adjustment 1", "suggestion 2"]
  },
  "portfolioEntries": [
    {
      "title": "string (Project Title)",
      "description": "string (How this project aligns to the job's scope)",
      "deliverables": ["deliverable 1", "deliverable 2"]
    }
  ],
  "countryRulesApplied": ["bullet of what country rule was enforced"]
}

Ensure your response is ONLY the raw JSON string. Do not wrap it in markdown codeblocks.
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: tailorCvSchema,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);

    } catch (error: any) {
      console.error("Error in /api/tailor-cv:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during CV tailoring." }, 500);
    }
  });

  // API endpoint for scanning company website/careers page using Google Search Grounding
  app.post("/api/scan-company-site", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { companyName, websiteUrl, jobTitle } = body;
      if (!companyName) {
        return c.json({ error: "Company name is required." }, 400);
      }

      const ai = getGeminiClient(c.env.GEMINI_API_KEY);

      const query = `Find the active careers and job listings page of "${companyName}" (${websiteUrl || ""}). Search for current open roles matching or related to "${jobTitle || "any role"}", their locations, departments, and specific experience requirements. Also identify if any special requirements exist (e.g. video intro, ID/visa documents, certificate uploads, portfolio, skill test, coding challenges).`;

      let responseText = "";

      try {
        console.log("Attempting careers scan with googleSearch grounding tool...");
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: query,
          config: {
            systemInstruction: `You are an elite corporate research agent. Search Google to get live, up-to-date data.
Analyze the careers page/website of the specified company. Find 1 to 3 active, realistic job positions.
Identify the country they belong to, and scan for special requirements.
Return a valid JSON object matching this structure EXACTLY:
{
  "companyName": "string",
  "website": "string",
  "openPositions": [
    {
      "title": "string",
      "department": "string",
      "location": "string",
      "country": "string (e.g., 'Saudi Arabia', 'UAE', 'USA')",
      "requirements": ["requirement 1", "requirement 2"],
      "description": "string (brief description of the role's scope)"
    }
  ],
  "customFormRequirements": "string (Identify form requirements)",
  "specialRequirementsDetected": ["certificates", "portfolio", "visa", "video", "challenge", "test", "none"]
}

Ensure your response is ONLY the raw JSON string. Do not wrap it in markdown codeblocks.`,
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: scanCompanySiteSchema
          }
        });
        responseText = response.text || "";
      } catch (searchError: any) {
        const errorMsg = searchError?.message || String(searchError);
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
          console.log("Google Search Grounding tool is currently rate-limited or out of quota. Falling back smoothly to direct Gemini reasoning...");
        } else {
          console.log("Google Search Grounding failed, falling back to direct Gemini reasoning. Details:", errorMsg);
        }
        
        const fallbackQuery = `Analyze the careers page/website of the specified company "${companyName}" (${websiteUrl || ""}). Synthesize 1 to 3 active, realistic job positions matching or related to "${jobTitle || "any role"}" based on your knowledge of the company's organizational structure, typical hiring sites, location distribution, and standard requirements. Also identify if any special requirements are likely to exist.`;
        
        const fallbackResponse = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: fallbackQuery,
          config: {
            systemInstruction: `You are an elite corporate research agent.
Synthesize the standard, highly realistic active open positions, locations, and requirements for the specified company.
Identify the country they belong to, and scan for special requirements.
Return a valid JSON object matching this structure EXACTLY:
{
  "companyName": "string",
  "website": "string",
  "openPositions": [
    {
      "title": "string",
      "department": "string",
      "location": "string",
      "country": "string (e.g., 'Saudi Arabia', 'UAE', 'USA')",
      "requirements": ["requirement 1", "requirement 2"],
      "description": "string (brief description of the role's scope)"
    }
  ],
  "customFormRequirements": "string (Identify form requirements)",
  "specialRequirementsDetected": ["certificates", "portfolio", "visa", "video", "challenge", "test", "none"]
}

Ensure your response is ONLY the raw JSON string. Do not wrap it in markdown codeblocks.`,
            responseMimeType: "application/json",
            responseSchema: scanCompanySiteSchema
          }
        });
        responseText = fallbackResponse.text || "";
      }

      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);

    } catch (error: any) {
      console.error("Error in /api/scan-company-site:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during company website scanning." }, 500);
    }
  });

  // API endpoint for scanning user's Gmail replies and extracting rejections / patterns
  app.post("/api/scan-emails", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { emails, applications } = body;
      if (!emails || !Array.isArray(emails)) {
        return c.json({ error: "Emails array is required." }, 400);
      }

      const ai = getGeminiClient(c.env.GEMINI_API_KEY);

      const emailContext = JSON.stringify(emails.map(e => ({
        id: e.id,
        from: e.from,
        subject: e.subject,
        snippet: e.snippet,
        date: e.date
      })));

      const trackedCompanyNames = (applications || []).map((app: any) => app.companyName);

      const query = `Analyze the following emails. Match them against tracked applications: [${trackedCompanyNames.join(", ")}].
Determine if any represent recruitment updates:
- Interview invites
- Assessment/coding challenges
- Rejections (look closely for feedback - e.g., lack of specific certification, missing country-specific visa details, lack of local experience, etc.)
- Offers

EMAILS DATA:
${emailContext}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: query,
        config: {
          systemInstruction: `You are an AI Job Search Assistant. Analyze the user's emails and organize them into recruitment updates.
For each relevant email, return a valid JSON object matching this schema. Focus on extracting specific constructive feedback for any rejections to enrich ${body.candidateName || body.profile?.name || 'the candidate'}'s "rejection learning feedback loop".
Return a valid JSON array of objects:
[
  {
    "id": "string (matching the input email ID)",
    "sender": "string",
    "subject": "string",
    "date": "string",
    "snippet": "string",
    "companyName": "string or null",
    "sentiment": "positive" | "negative" | "neutral",
    "statusChange": "applied" | "interviewing" | "offered" | "rejected" | "none",
    "summary": "string",
    "actionRequired": "string",
    "rejectionFeedback": "string (if rejected, why? e.g. 'Lack of Saudi licensing', 'Missing warehouse safety certificate' or null)",
    "rejectionPattern": "string (if rejected, generalized pattern e.g. 'Missing certifications', 'Lack of regional keywords' or null)"
  }
]

Ensure your response is ONLY the raw JSON string. Do not wrap it in markdown codeblocks.`,
          responseMimeType: "application/json",
          responseSchema: scanEmailsSchema
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);

    } catch (error: any) {
      console.error("Error in /api/scan-emails:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during email scanning." }, 500);
    }
  });

  // FlowCV-style Multi-CV Generator
  app.post("/api/generate-cv-variant", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { masterCv, category, name } = body;
      if (!masterCv) {
        return c.json({ error: "Master CV content is required." }, 400);
      }
      if (!category) {
        return c.json({ error: "Target CV Category (e.g. Storekeeper, Housekeeping) is required." }, 400);
      }

      const ai = getGeminiClient(c.env.GEMINI_API_KEY);

      const prompt = `
You are an expert FlowCV-style Resume builder and elite executive recruiter.
Your task is to take ${body.candidateName || body.profile?.name || 'the candidate'}'s master CV and re-architect it specifically for the role category of "${category}".
Emphasize relevant achievements, experience bullets, and hard skills matching this exact industry focus. Keep descriptions completely realistic and based on the master CV but highly tuned for ATS matching.

MASTER CV DATA:
${masterCv}

INSTRUCTIONS:
1. Rewrite the professional summary to focus intensely on "${category}". Make it an executive-level pitch.
2. Extract and reorganize the skill list to highlight keywords critical for "${category}". Group them cleanly.
3. Optimize existing experience bullet points. You MUST use the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]). Make every bullet point start with a strong action verb and include quantifiable metrics wherever plausible based on the master CV.
4. Keep the output clean, modern, and in standard markdown formatting. Use '#' for the candidate's name, and '##' for main sections. Ensure beautiful, scannable formatting.

Return a valid JSON object matching this structure EXACTLY:
{
  "category": "${category}",
  "cvText": "string containing the full tailored resume in Markdown",
  "optimizedSkills": ["skill 1", "skill 2", "skill 3"],
  "summary": "brief summary of the core matching value proposition"
}
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: generateCvVariantSchema,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);

    } catch (error: any) {
      console.error("Error in /api/generate-cv-variant:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during CV variant generation." }, 500);
    }
  });

  // Trigger continuous automation cycle simulation
  app.post("/api/trigger-automation-cycle", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { profile, existingApplications } = body;
      if (!profile) {
        return c.json({ error: "User profile settings are required." }, 400);
      }

      const ai = getGeminiClient(c.env.GEMINI_API_KEY);

      const prompt = `
You are ${body.candidateName || body.profile?.name || 'the candidate'}'s Hyper-Automation Job Search Agent.
Simulate a full continuous optimization cycle based on ${body.candidateName || body.profile?.name || 'the candidate'}'s settings and return a structured report of what actions were taken.

CANDIDATE'S PROFILE AND SETTINGS:
- Name: "${profile.name}"
- Preferred Categories: [${(profile.preferredCategories || []).join(", ")}]
- Preferred Countries: [${(profile.preferredCountries || []).join(", ")}]
- Excluded Countries: [${(profile.excludedCountries || []).join(", ")}]
- Allow Related Categories: ${profile.allowRelatedCategories}
- Current Mode: "${profile.mode}"

EXISTING PIPELINE LENGTH: ${(existingApplications || []).length} jobs tracked.

TASK:
Simulate searching globally, finding 2 relevant roles, analyzing their descriptions, matching them to ${body.candidateName || body.profile?.name || 'the candidate'}'s multi-CV variants, checking authenticity, calculating success scores, applying country-specific rules, deciding whether to auto-apply silently (if mode is "fully_auto" and success score >= 80 and no special requirements exist), and organizing results.

Return a valid JSON object with this schema:
{
  "cycleSummary": "Summary of the optimization cycle",
  "logs": [
    {
      "timestamp": "string (formatted as HH:MM:SS)",
      "level": "info" | "success" | "warning" | "error",
      "message": "string"
    }
  ],
  "discoveredJobs": [
    {
      "companyName": "string",
      "jobTitle": "string",
      "jobUrl": "string",
      "location": "string (City, Country)",
      "country": "string",
      "category": "string",
      "description": "string",
      "successScore": number,
      "authenticity": {
        "rating": "safe" | "suspicious",
        "reason": "string"
      },
      "interviewPrediction": {
        "chance": "high" | "medium" | "low",
        "probability": number,
        "breakdown": "string"
      },
      "appliedAction": "applied_silently" | "flagged_semi_auto" | "flagged_special_requirements" | "ignored_suspicious",
      "reason": "string explaining action taken"
    }
  ],
  "learnedAdjustments": ["bullet explaining how CV or coverage rules were auto-optimized based on pipeline rejections or trends"]
}
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: `You are ${body.candidateName || body.profile?.name || 'the candidate'}'s Hyper-Automation Job Search Agent.
Generate a valid JSON object exactly matching the requested schema.
CRITICAL: Every string property MUST have all raw newline characters properly escaped as "\\n" and any double quotes properly escaped as "\\\"". Do not output raw control characters.`,
          responseMimeType: "application/json",
          responseSchema: triggerAutomationCycleSchema,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);

    } catch (error: any) {
      console.error("Error in /api/trigger-automation-cycle:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during automation cycle execution." }, 500);
    }
  });

  // API endpoint to generate safe AI replies to HR emails adhering to safety guardrails
  app.post("/api/draft-hr-reply", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { hrMessage, jobTitle, companyName, candidateName } = body;
      if (!hrMessage) {
        return c.json({ error: "HR message is required." }, 400);
      }

      const ai = getGeminiClient(c.env.GEMINI_API_KEY);

      const prompt = `
You are ${body.candidateName || body.profile?.name || 'the candidate'}'s defensive Job Search Negotiation and HR Chatbot Agent.
Your objective is to review an email or chat message from HR/Recruiter and draft a highly professional, polite, and strategic reply.
You MUST strictly adhere to the following SAFETY RULES:
1. NEVER disclose specific salary expectations or previous salary prematurely. If asked, politely redirect or ask for their approved budget band first.
2. NEVER agree to immediate salary reductions, downgrade in role, or worse terms without consulting ${body.candidateName || body.profile?.name || 'the candidate'} first.
3. NEVER commit to immediate in-person meetings if the country is not preferred (stay inside GCC/preferred countries).
4. Always frame answers to highlight ${body.candidateName || body.profile?.name || 'the candidate'}'s key value, certifications, and enthusiasm.

HR/RECRUITER MESSAGE RECEIVED:
"${hrMessage}"

JOB DETAILS:
- Job Title: "${jobTitle || "the position"}"
- Company: "${companyName || "the company"}"
- Candidate Name: "${candidateName || "${body.candidateName || body.profile?.name || 'the candidate'}"}"

Generate:
1. A drafted reply that is clean, professional, safe, and ready to send.
2. A checklist of "Safety Audits Performed" explaining how the reply protected ${body.candidateName || body.profile?.name || 'the candidate'} (e.g. "Politely avoided premature salary disclosure").
3. An overall safety rating (0-100) of the response.

Return a valid JSON object matching this structure EXACTLY:
{
  "draftedReply": "string containing the full reply text",
  "safetyAudits": ["audit 1", "audit 2"],
  "safetyScore": number
}

Ensure your response is ONLY the raw JSON string. Do not wrap it in markdown codeblocks.
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: draftHrReplySchema,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);

    } catch (error: any) {
      console.error("Error in /api/draft-hr-reply:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during safe reply generation." }, 500);
    }
  });

  // API endpoint for parsing uploaded CV files (PDF, TXT, etc.)
  app.post("/api/parse-cv", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { fileData, fileName, fileType } = body;
      if (!fileData) {
        return c.json({ error: "No CV data provided." }, 400);
      }

      const ai = getGeminiClient(c.env.GEMINI_API_KEY);
      let contents: any[] = [];

      if (fileType === "application/pdf" || fileType === "text/plain") {
        contents.push({
          inlineData: {
            mimeType: fileType,
            data: fileData
          }
        });
      } else {
        contents.push({
          text: `We have uploaded a file named "${fileName}" of type "${fileType}". Please parse its CV details.`
        });
      }

      const prompt = `
You are an expert CV Parser and ATS optimization engine.
Analyze the uploaded resume file. Extract and structure the candidate's professional CV details into a high-fidelity JSON object.
Extract or synthesize the following sections:
1. Summary: A professional executive summary.
2. Skills: An array of hard and soft skills.
3. Experience: An array of employment details containing { "title", "company", "duration", "description" }.
4. Education: An array of academic credentials containing { "school", "degree", "duration" }.
5. Certificates: An array of professional certifications or licenses.
6. MissingFields: Identify any critical information or sections that are missing or incomplete in the CV (e.g. "No certificates listed", "Experience gaps", "No phone number", "Missing LinkedIn profile link") to help the candidate fix ATS gaps.

Ensure you return a valid JSON object matching this structure EXACTLY:
{
  "name": "string (Candidate's Name if detected, default to '${body.candidateName || body.profile?.name || 'the candidate'}')",
  "email": "string (Candidate's Email if detected)",
  "phone": "string (Candidate's Phone if detected)",
  "summary": "string",
  "skills": ["skill 1", "skill 2"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "duration": "string"
    }
  ],
  "certificates": ["certificate 1", "certificate 2"],
  "missingFields": ["missing field description 1", "missing field description 2"]
}

Ensure your response is ONLY the raw JSON string. Do not wrap it in markdown codeblocks.
`;

      contents.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: parseCvSchema,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/parse-cv:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during CV parsing." }, 500);
    }
  });

  // API endpoint for generating CV with AI from scratch
  app.post("/api/generate-ai-cv", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { profile, extraPrompts } = body;
      const ai = getGeminiClient(c.env.GEMINI_API_KEY);

      const prompt = `
You are an elite, professional CV writer and resume designer.
Based on the candidate's target career preferences and profile, generate a high-fidelity, complete, and professionally styled Master Resume in Markdown format.
Align it to bypass Applicant Tracking Systems (ATS) and highlight strong achievement metrics.

CANDIDATE DETAILS:
- Name: "${profile?.name || "${body.candidateName || body.profile?.name || 'the candidate'}"}"
- Preferred Categories: [${(profile?.preferredCategories || ["Storekeeper", "Logistics Coordinator"]).join(", ")}]
- Preferred Countries: [${(profile?.preferredCountries || ["UAE", "Saudi Arabia"]).join(", ")}]
${extraPrompts ? `- Additional Directives: "${extraPrompts}"` : ""}

Generate a highly structured resume containing:
1. Executive Summary
2. Core Technical & Professional Skills (Categorized)
3. Experience timeline (at least 2 substantial roles matching logistics/hospitality) with rich impact metrics (e.g. "Managed $5M inventory, reduced warehouse discrepancies by 15%")
4. Education Details
5. Professional Certifications (such as UAE Forklift License, Warehouse Safety, etc.)

Return a valid JSON object matching this structure EXACTLY:
{
  "name": "string",
  "summary": "string",
  "skills": ["string", "string"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "duration": "string"
    }
  ],
  "certificates": ["string", "string"],
  "masterCvText": "full resume text styled in beautiful Markdown ready for copying"
}

Ensure your response is ONLY the raw JSON string. Do not wrap it in markdown codeblocks.
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: generateAiCvSchema,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/generate-ai-cv:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during AI CV generation." }, 500);
    }
  });

  // API endpoint for LinkedIn Data Import
  app.post("/api/import-linkedin", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { linkedinUrl } = body;
      if (!linkedinUrl) {
        return c.json({ error: "LinkedIn URL is required." }, 400);
      }

      const ai = getGeminiClient(c.env.GEMINI_API_KEY);

      const prompt = `
You are an advanced LinkedIn crawler and intelligence agent.
Simulate fetching, parsing, and extracting a professional profile from the given LinkedIn URL: "${linkedinUrl}".
Extract names, keywords, and industries from the URL if possible (e.g., "johndoe" means Name: "${body.candidateName || body.profile?.name || 'the candidate'}", "logistics" means Logistics Industry). If the URL is generic (like "linkedin.com/in/user123"), you can synthesize a highly complete profile for a professional aligning with ${body.candidateName || body.profile?.name || 'the candidate'}'s target careers (Logistics, Warehouse Storekeeper, Housekeeping Supervisor), but set "isIncomplete" to true if the URL is highly generic or anonymous.

Return a valid JSON object matching this structure EXACTLY:
{
  "name": "string (The candidate's name)",
  "headline": "string (LinkedIn headline e.g., 'Lead Storekeeper & Warehouse Logistics Supervisor')",
  "summary": "string (LinkedIn About summary)",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "skills": ["skill 1", "skill 2"],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "duration": "string"
    }
  ],
  "certificates": ["certificate 1", "certificate 2"],
  "isIncomplete": boolean (set to true if the URL lacks sufficient detail or is generic, suggesting the user should upload a CV),
  "missingFields": ["missing section 1", "missing section 2"]
}

Ensure your response is ONLY the raw JSON string. Do not wrap it in markdown codeblocks.
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: importLinkedinSchema,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/import-linkedin:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during LinkedIn profile import." }, 500);
    }
  });

  // API endpoint for Fusing LinkedIn + CV Data into a Master Profile
  app.post("/api/generate-full-profile", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { cvData, linkedinData } = body;
      if (!cvData && !linkedinData) {
        return c.json({ error: "Please provide either CV data or LinkedIn data to fuse." }, 400);
      }

      const ai = getGeminiClient(c.env.GEMINI_API_KEY);

      const prompt = `
You are an expert resume architect. Your job is to take raw parsed CV data and parsed LinkedIn profile data, fuse them together into a single "Source of Truth" Master Profile, and generate a beautiful Master CV in Markdown.
Merge duplicate experience records chronologically. Combine unique skills, certifications, and educational credentials. Highlight the candidate's strongest achievements and align them for ATS matching.

CV DATA RECEIVED:
${cvData ? JSON.stringify(cvData) : "(None)"}

LINKEDIN DATA RECEIVED:
${linkedinData ? JSON.stringify(linkedinData) : "(None)"}

Return a valid JSON object matching this structure EXACTLY:
{
  "name": "string (Fused Name)",
  "email": "string (Fused Email)",
  "phone": "string (Fused Phone)",
  "summary": "string (Fused/optimized professional summary)",
  "skills": ["skill 1", "skill 2"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "duration": "string"
    }
  ],
  "certificates": ["certificate 1", "certificate 2"],
  "masterCvText": "fused and beautifully designed Master CV in Markdown format, with elegant bullet points, clear headings, and clean margins. Ensure it looks complete and highly professional."
}

Ensure your response is ONLY the raw JSON string. Do not wrap it in markdown codeblocks.
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: generateFullProfileSchema,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/generate-full-profile:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during profile fusion and auto-generation." }, 500);
    }
  });

  // API endpoint for generating a unified profile with AI, analyzing career gaps, and filling them in
  app.post("/api/generate-profile-ai", verifyFirebaseToken, apiLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(()=>({}));
      const { cvData, linkedinData, preferredCategories } = body;
      
      const ai = getGeminiClient(c.env.GEMINI_API_KEY);

      const prompt = `
You are an expert AI Career Coach and Resume Optimization Architect. 
Your goal is to consolidate a candidate's uploaded CV data and their LinkedIn import data, identify missing sections, skills, and credentials based on their target career path, and produce a complete, highly structured Master Profile object.

TARGET CAREER PATH / ROLES:
${preferredCategories && preferredCategories.length > 0 ? preferredCategories.join(", ") : "Logistics, Supply Chain, and Warehouse Operations"}

CV DATA RECEIVED:
${cvData ? JSON.stringify(cvData) : "(None)"}

LINKEDIN DATA RECEIVED:
${linkedinData ? JSON.stringify(linkedinData) : "(None)"}

INSTRUCTIONS:
1. CONSOLIDATION: Merge and deduplicate the work experience, academic history, skills, and certificates from both the CV and LinkedIn sources. Keep the most detailed and chronological version of experience items.
2. CAREER PATH GAP ANALYSIS: Evaluate the candidate's consolidated background against their target career path (${preferredCategories && preferredCategories.length > 0 ? preferredCategories.join(", ") : "Logistics, Supply Chain, and Warehouse Operations"}). 
   Identify:
   - Critical technical or soft skills that are missing but standard for this path.
   - Missing industry certifications or licenses (e.g. forklift license, safety certifications, supply chain credentials) that would boost ATS compliance.
   - Missing details in job descriptions (e.g. lack of quantified performance metrics like inventory value managed or turnaround time reduced).
3. AUTOMATIC COMPLETION: Synthesize optimized summaries, highlight essential skills, and clean up descriptions. Output these as the structured profile.
4. OUTCOME: Provide the structured JSON output with a complete resume in beautifully formatted Markdown, a clear list of identified missing sections/gaps, and professional action items to close those gaps.

Return a valid JSON object matching this structure EXACTLY:
{
  "name": "string (Fused Name)",
  "email": "string (Fused Email)",
  "phone": "string (Fused Phone)",
  "summary": "string (Consolidated, ATS-optimized, professional summary focusing on the target career path)",
  "skills": ["fused skill 1", "fused skill 2", "essential target skill 3"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "description": "string (optimized with metrics and target keywords)"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "duration": "string"
    }
  ],
  "certificates": ["certificate 1", "certificate 2"],
  "masterCvText": "Beautifully structured, print-ready, high-fidelity Master CV in Markdown format. Use elegant spacing, clear headings, bulleted accomplishments, and bold keyword highlights.",
  "identifiedMissingGaps": [
    "e.g., Missing Forklift Operator License (highly requested in UAE logistics roles)",
    "e.g., Lack of quantified metrics in the Storekeeper role description"
  ],
  "careerPathSuggestions": [
    "e.g., Add a professional certification in Warehouse Safety (OSHA or equivalent)",
    "e.g., Update experience section to mention ERP/SAP system proficiency"
  ]
}

Ensure your response is ONLY the raw JSON string. Do not wrap it in markdown codeblocks.
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: generateProfileAiSchema,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedData = safeJsonParse(responseText);
      return c.json(parsedData);
    } catch (error: any) {
      console.error("Error in /api/generate-profile-ai:", error);
      return c.json({ error: error?.message || "An unexpected error occurred during AI profile generation and gap analysis." }, 500);
    }
  });



app.post("/api/generate-career-roadmap", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { profile } = reqBody;

    const prompt = `
    Profile: ${JSON.stringify(profile)}
    
    Task: Act as an expert AI Career Coach. Based on this profile, generate a comprehensive career roadmap.
    Provide actionable promotion advice, salary improvement suggestions, certification recommendations, skill gap analysis, industry trends, and weekly/monthly goals.
    
    Return a strictly formatted JSON object matching this structure:
    {
      "careerRoadmap": "Detailed roadmap string",
      "promotionAdvice": "Advice string",
      "salaryImprovement": "Suggestions string",
      "certifications": ["Cert 1", "Cert 2"],
      "skillGaps": ["Gap 1", "Gap 2"],
      "industryTrends": ["Trend 1", "Trend 2"],
      "weeklyGoals": ["Goal 1", "Goal 2"],
      "monthlyGoals": ["Goal 1", "Goal 2"]
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert executive career coach. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/generate-career-roadmap:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/analyze-resume", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { cvText, targetJob } = reqBody;

    const prompt = `
    Target Job (Optional): ${targetJob || 'General alignment'}
    CV Text: ${cvText}
    
    Task: Act as an expert ATS (Applicant Tracking System) Analyzer. Analyze the CV for formatting, keywords, readability, and overall strength against the target job or general best practices.
    
    Return a strictly formatted JSON object:
    {
      "overallScore": 85,
      "atsScore": 90,
      "grammarScore": 95,
      "readabilityScore": 80,
      "missingKeywords": ["Keyword 1", "Keyword 2"],
      "missingSkills": ["Skill 1", "Skill 2"],
      "weakSections": ["Section 1", "Section 2"],
      "suggestedImprovements": ["Tip 1", "Tip 2"],
      "successPrediction": "High/Medium/Low with brief reasoning"
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert ATS analyzer. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/analyze-resume:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/generate-cover-letter", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { profile, jobDescription, companyName } = reqBody;

    const prompt = `
    Candidate Profile Master CV: ${profile.masterCvText || JSON.stringify(profile)}
    Company Name: ${companyName}
    Job Description: ${jobDescription}
    Tone & Style: ${reqBody.tone || 'Professional'}
    
    Task: Write a highly professional, tailored cover letter. Keep it compelling, metric-driven, and concise.
    
    - If the tone is "Executive", use high-impact leadership language and focus on ROI, business strategy, and scalable impact.
    - If the tone is "Creative", use engaging, storytelling-driven language that highlights out-of-the-box thinking.
    - If the tone is "Short & Direct", keep it under 150 words with punchy bullet points directly addressing the core requirements.
    - Otherwise, use a standard professional, recruiter-ready tone that focuses on value-add.
    
    - IMPORTANT: FORMAT IN ELEGANT MARKDOWN. Do not include placeholder names like [Your Name]; use the actual data from the profile. 
    
    Return a strictly formatted JSON object:
    {
      "coverLetterText": "The complete cover letter text in Markdown format"
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert career consultant. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/generate-cover-letter:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/calculate-granular-job-match", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { cvText, jobDescription } = reqBody;

    const prompt = `
    Job Description: ${jobDescription}
    CV Text: ${cvText}
    
    Task: Perform a granular compatibility match between the CV and the Job Description.
    
    Return a strictly formatted JSON object:
    {
      "overallMatchScore": 88,
      "skillMatchScore": 90,
      "experienceMatchScore": 85,
      "educationMatchScore": 100,
      "atsCompatibilityScore": 92,
      "languageMatchScore": 100
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert ATS and HR matching system. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/calculate-granular-job-match:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/generate-interview-questions", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { jobDescription, companyName, roleLevel } = reqBody;

    const prompt = `
    Job Description: ${jobDescription}
    Company: ${companyName}
    Level: ${roleLevel}
    
    Task: Act as an expert Technical Recruiter and Hiring Manager. Generate 5 highly relevant interview questions (mix of behavioral, situational, and technical) for this specific role. For each question, provide a brief tip on what the interviewer is looking for.
    
    Return a strictly formatted JSON object matching this structure:
    {
      "questions": [
        {
          "type": "Behavioral",
          "question": "Tell me about a time...",
          "hint": "They want to see leadership..."
        }
      ]
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert technical interviewer. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/generate-interview-questions:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/evaluate-interview-answer", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { question, answer, jobDescription } = reqBody;

    const prompt = `
    Job Context: ${jobDescription}
    Question Asked: ${question}
    Candidate's Answer: ${answer}
    
    Task: Act as a tough but fair Hiring Manager. Grade the answer out of 100. Provide specific feedback on what was good, what was missing, and how to improve it using the STAR method if applicable.
    
    Return a strictly formatted JSON object:
    {
      "score": 85,
      "feedback": "Your answer was strong because...",
      "improvementTips": ["Tip 1", "Tip 2"],
      "modelAnswer": "A brief example of a 100/100 answer"
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert hiring manager evaluating answers. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/evaluate-interview-answer:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/predict-salary", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { jobTitle, location, experience, profileData } = reqBody;

    const prompt = `
    Title: ${jobTitle}
    Location: ${location}
    Years of Experience: ${experience}
    Profile: ${JSON.stringify(profileData)}
    
    Task: Act as an expert Compensation Analyst. Estimate the current market salary range for this role in this location given the candidate's profile strength. Also provide a brief negotiation script.
    
    Return a strictly formatted JSON object:
    {
      "estimatedMinimum": 80000,
      "estimatedMaximum": 120000,
      "currency": "USD",
      "marketDemand": "High",
      "confidenceScore": 85,
      "factors": ["Location commands a premium", "Specialized skills add 10%"],
      "negotiationScript": "Thank you for the offer. Based on my specialized experience in..."
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are a compensation and negotiation expert. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/predict-salary:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/generate-learning-path", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { targetRole, currentProfile } = reqBody;

    const prompt = `
    Target Role: ${targetRole}
    Current Profile: ${JSON.stringify(currentProfile)}
    
    Task: Act as an expert Career Counselor. Identify the exact skills the candidate is missing to achieve the Target Role, and generate a customized, multi-week learning path with specific course/resource recommendations.
    
    Return a strictly formatted JSON object:
    {
      "targetRole": "Role name",
      "criticalMissingSkills": ["Skill 1", "Skill 2"],
      "learningModules": [
        {
          "week": 1,
          "focusArea": "Core Concepts",
          "recommendedResource": "Specific course name or book",
          "estimatedHours": 10
        }
      ]
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert career and learning strategist. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/generate-learning-path:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/get-company-intelligence", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { companyName } = reqBody;

    const prompt = `
    Target Company: ${companyName}
    
    Task: Act as an expert Corporate Intelligence Analyst. Provide a highly detailed intelligence report on this company for a job seeker. Include company culture, recent news/trends, pros and cons of working there, and typical interview processes. If the company is generic or unknown, provide general industry standards.
    
    Return a strictly formatted JSON object:
    {
      "companyName": "${companyName}",
      "overview": "Brief overview...",
      "culture": "Culture details...",
      "recentNews": ["News 1", "News 2"],
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "interviewProcess": "Typical process..."
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert corporate intelligence analyst. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/get-company-intelligence:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/generate-daily-job-matches", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { profile } = reqBody;

    const prompt = `
    User Profile Master CV: ${profile.masterCvText || JSON.stringify(profile)}
    Preferred Categories: ${profile.preferredCategories?.join(', ') || 'Not specified'}
    
    Task: Act as an elite AI Job Matchmaker and Headhunter. Based on the user's master CV and preferred categories, generate 3 highly relevant fictional job openings that they would be a perfect fit for today. 
    
    Ensure the job titles, companies, and descriptions look extremely realistic, enterprise-grade, and highly tailored to their profile strengths. The descriptions should sound like they were written by a Fortune 500 hiring manager.
    Include an AI match score out of 100 for each.
    
    Return a strictly formatted JSON object:
    {
      "date": "Today's Date",
      "jobs": [
        {
          "id": "1",
          "title": "Job Title",
          "company": "Company Name",
          "location": "Location or Remote",
          "salaryRange": "$X - $Y",
          "matchScore": 95,
          "matchReason": "Why they match perfectly based on specific CV highlights",
          "description": "Brief, compelling, enterprise-grade job description"
        }
      ]
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an AI job matchmaker. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/generate-daily-job-matches:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/generate-outreach-email", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { company, hiringManager, profile } = reqBody;

    const prompt = `
    Target Company: ${company}
    Hiring Manager / Recruiter: ${hiringManager}
    User Profile: ${JSON.stringify(profile)}
    
    Task: Act as an expert career strategist. Write a highly professional, concise, and compelling cold outreach email to the hiring manager. Focus on the user's value proposition without sounding desperate. Include a catchy subject line.
    
    Return a strictly formatted JSON object:
    {
      "subject": "Email Subject...",
      "body": "Email Body...",
      "strategyTip": "Why this works..."
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert career strategist. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/generate-outreach-email:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});


app.post("/api/generate-linked-in-note", verifyFirebaseToken, apiLimiter, async (c) => {
  try {
    const reqBody = await c.req.json().catch(() => ({}));
    const { company, targetRole, profile } = reqBody;

    const prompt = `
    Target Company: ${company}
    Target Role: ${targetRole}
    User Profile: ${JSON.stringify(profile)}
    
    Task: Draft a short, impactful LinkedIn connection request note (max 300 characters) to a recruiter at the target company. It must be personalized, polite, and highlight one key strength.
    
    Return a strictly formatted JSON object:
    {
      "note": "Hi [Name], ...",
      "characterCount": 250
    }
    `;

    const ai = getGeminiClient(c.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert career strategist. Return valid JSON only.",
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini.");
    }

    const parsedData = safeJsonParse(responseText);
    return c.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/generate-linked-in-note:", error);
    return c.json({ error: error?.message || "An unexpected error occurred." }, 500);
  }
});

export default app;
