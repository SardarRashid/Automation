import os

filepath = 'src/services/aiService.ts'

new_methods = """
  async getCompanyIntelligence(companyName: string) {
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
    const responseText = await generateWithRetry(prompt, "You are an expert corporate intelligence analyst. Return valid JSON only.");
    return extractJson(responseText);
  },

  async generateDailyJobMatches(profile: any) {
    const prompt = `
    User Profile: ${JSON.stringify(profile)}
    
    Task: Act as an AI Job Matchmaker. Based on the user's skills and experience, generate 3 highly relevant fictional job openings that they would be a perfect fit for today. Ensure the job titles, companies, and descriptions look realistic and highly tailored to their profile. Include an AI match score out of 100 for each.
    
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
          "matchReason": "Why they match perfectly",
          "description": "Brief job description"
        }
      ]
    }
    `;
    const responseText = await generateWithRetry(prompt, "You are an AI job matchmaker. Return valid JSON only.");
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
    print("Appended Batch 4 AI methods to aiService.ts")
else:
    print("Could not find the end of aiService object.")
