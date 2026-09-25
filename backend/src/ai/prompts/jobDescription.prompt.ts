export function createJobDescriptionPrompt(params: {
  title: string;
  notes: string;
  skills: string[];
  experienceYears?: number;
}): string {
  return `You are a recruitment specialist for JobConnect.
Draft a professional, compelling, and inclusive Job Description based on the recruiter's raw notes.

Role Title: ${params.title}
Key Skills: ${params.skills.join(', ')}
Target Experience: ${params.experienceYears || '2+'} years

Raw Recruiter Notes:
"""
${params.notes.substring(0, 1500)}
"""

Format your response strictly as valid JSON:
{
  "title": "${params.title}",
  "overview": "Engaging 2-paragraph introduction about the role and impact",
  "responsibilities": [
    "Clear, action-oriented bullet 1",
    "Clear, action-oriented bullet 2",
    "Clear, action-oriented bullet 3",
    "Clear, action-oriented bullet 4"
  ],
  "requirements": [
    "Mandatory qualification 1",
    "Mandatory qualification 2",
    "Mandatory qualification 3"
  ],
  "preferredSkills": [
    "Bonus skill 1",
    "Bonus skill 2"
  ],
  "suggestedInterviewQuestions": [
    "Technical question 1",
    "Behavioral question 2"
  ]
}`;
}
