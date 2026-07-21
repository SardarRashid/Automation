import os

filepath = 'src/services/aiService.ts'

new_methods = """
  async generateCareerRoadmap(profile: any) {
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
    const responseText = await generateWithRetry(prompt, "You are an expert executive career coach. Return valid JSON only.");
    return extractJson(responseText);
  },

  async analyzeResume(cvText: string, targetJob?: string) {
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
    const responseText = await generateWithRetry(prompt, "You are an expert ATS analyzer. Return valid JSON only.");
    return extractJson(responseText);
  },

  async generateCoverLetter(profile: any, jobDescription: string, companyName: string) {
    const prompt = `
    Candidate Profile: ${JSON.stringify(profile)}
    Company Name: ${companyName}
    Job Description: ${jobDescription}
    
    Task: Write a highly professional, tailored cover letter. Keep it compelling and concise.
    
    Return a strictly formatted JSON object:
    {
      "coverLetterText": "The complete cover letter text in standard format (not markdown)"
    }
    `;
    const responseText = await generateWithRetry(prompt, "You are an expert career consultant. Return valid JSON only.");
    return extractJson(responseText);
  },

  async calculateGranularJobMatch(cvText: string, jobDescription: string) {
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
    const responseText = await generateWithRetry(prompt, "You are an expert ATS and HR matching system. Return valid JSON only.");
    return extractJson(responseText);
  }
};
"""

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the closing "};" with the new methods
if content.strip().endswith('};'):
    # Find the last "};"
    last_brace_idx = content.rfind('};')
    new_content = content[:last_brace_idx] + ",\n" + new_methods
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Appended new methods to aiService.ts")
else:
    print("Could not find the end of aiService object. Make sure it ends with '};'")
