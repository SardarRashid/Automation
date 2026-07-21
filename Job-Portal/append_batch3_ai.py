import os

filepath = 'src/services/aiService.ts'

new_methods = """
  async generateInterviewQuestions(jobDescription: string, companyName: string, roleLevel: string) {
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
    const responseText = await generateWithRetry(prompt, "You are an expert technical interviewer. Return valid JSON only.");
    return extractJson(responseText);
  },

  async evaluateInterviewAnswer(question: string, answer: string, jobDescription: string) {
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
    const responseText = await generateWithRetry(prompt, "You are an expert hiring manager evaluating answers. Return valid JSON only.");
    return extractJson(responseText);
  },

  async predictSalary(jobTitle: string, location: string, experience: number, profileData: any) {
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
    const responseText = await generateWithRetry(prompt, "You are a compensation and negotiation expert. Return valid JSON only.");
    return extractJson(responseText);
  },

  async generateLearningPath(targetRole: string, currentProfile: any) {
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
    const responseText = await generateWithRetry(prompt, "You are an expert career and learning strategist. Return valid JSON only.");
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
    print("Appended Batch 3 AI methods to aiService.ts")
else:
    print("Could not find the end of aiService object.")
