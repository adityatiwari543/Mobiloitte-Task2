export function createJobSummaryPrompt(title: string, description: string, skills: string[]): string {
  // Delimit untrusted user inputs to defend against prompt injection (Section 15.7)
  return `You are an expert technical recruiter assistant for JobConnect.
Analyze the following job description and provide a structured JSON response.

Job Title: ${title}
Skills Specified: ${skills.join(', ')}

--- UNTRUSTED JOB DESCRIPTION START ---
${description.substring(0, 4000)}
--- UNTRUSTED JOB DESCRIPTION END ---

Provide output strictly in valid JSON with these keys:
{
  "roleOverview": "2-3 concise sentences explaining the role",
  "coreResponsibilities": ["bullet 1", "bullet 2", "bullet 3"],
  "mustHaveSkills": ["skill 1", "skill 2"],
  "experienceExpectations": "summary of required seniority/years",
  "salaryAndWorkMode": "summary of compensation and remote/onsite terms",
  "missingInformation": "any vital details the recruiter did not specify (e.g. visa sponsorship, specific frameworks)"
}`;
}
