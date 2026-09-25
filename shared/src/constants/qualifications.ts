export const HIGHEST_QUALIFICATIONS = [
  'High School',
  'Diploma',
  "Bachelor's",
  "Master's",
  'Doctorate/Ph.D.',
  'Post Doctorate',
  'Other Certification',
] as const;

export type HighestQualification = (typeof HIGHEST_QUALIFICATIONS)[number];
