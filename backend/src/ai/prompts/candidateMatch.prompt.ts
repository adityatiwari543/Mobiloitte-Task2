export function createCandidateMatchPrompt(params: {
  jobTitle: string;
  jobSkills: string[];
  jobDescription: string;
  candidateSkills: string[];
  candidateHeadline?: string;
  candidateBio?: string;
}): string {
  const { jobTitle, jobSkills, jobDescription, candidateSkills, candidateHeadline, candidateBio } = params;

  return `You are an AI Career Assistant for JobConnect.
Compare the candidate's background against the job posting to provide an objective matching explanation and preparation guidance.
IMPORTANT: This is assistive feedback only, not an automated hiring rejection or selection.

Job Details:
Title: ${jobTitle}
Required Skills: ${jobSkills.join(', ')}
--- JOB SNIPPET ---
${jobDescription.substring(0, 2000)}
-------------------

Candidate Background:
Headline: ${candidateHeadline || 'Candidate'}
Candidate Skills: ${candidateSkills.join(', ')}
Bio: ${(candidateBio || '').substring(0, 1000)}

Respond in valid JSON format:
{
  "overallMatchGrade": "Strong Match" | "Moderate Match" | "Growth Opportunity",
  "technicalSkillsMatch": {
    "matchingSkills": ["skill 1", "skill 2"],
    "missingOrRecommendedSkills": ["skill 3"]
  },
  "strengthsAnalysis": "Why the candidate fits well",
  "preparationTips": ["Preparation suggestion 1", "Preparation suggestion 2"],
  "disclaimer": "AI recommendations are for assistance only. Recruiters make final hiring decisions."
}`;
}
