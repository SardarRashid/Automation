import os

filepath = 'src/services/aiService.ts'

new_methods = """
  async generateOutreachEmail(company: string, hiringManager: string, profile: any) {
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
    const responseText = await generateWithRetry(prompt, "You are an expert career strategist. Return valid JSON only.");
    return extractJson(responseText);
  },

  async generateLinkedInNote(company: string, targetRole: string, profile: any) {
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
    const responseText = await generateWithRetry(prompt, "You are an expert career strategist. Return valid JSON only.");
    return extractJson(responseText);
  }
};
"""

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if content.strip().endswith('};'):
    last_brace_idx = content.rfind('};')
    new_content = content[:last_brace_idx] + ",\n" + new_methods
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Appended Batch 5 AI methods to aiService.ts")
else:
    print("Could not find the end of aiService object.")
