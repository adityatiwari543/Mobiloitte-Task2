// Prohibited placeholder / dummy usernames (Section 6A.9)
export const BLOCKED_USERNAMES = new Set([
  'test',
  'testing',
  'admin',
  'administrator',
  'fake',
  'dummy',
  'sample',
  'root',
  'qwerty',
  '123456',
  'noreply',
  'no-reply',
  'user',
  'info',
  'support',
  'null',
  'undefined',
]);

// Known disposable/temporary email provider domains (Section 6A.10)
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'yopmail.com',
  'guerrillamail.com',
  'trashmail.com',
  'sharklasers.com',
  'getairmail.com',
  'dispostable.com',
  'mohmal.com',
  'crazymailing.com',
  'fakemailgenerator.com',
  'generator.email',
  'throwawaymail.com',
  'temp-mail.org',
  'dropmail.me',
  'fakeinbox.com',
]);

// Reserved / testing placeholder domains (Section 6A.11)
export const RESERVED_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'sample.com',
  'localhost',
  'fake.com',
]);

// Reserved TLDs that are never routed on public internet (Section 6A.11)
export const RESERVED_TLDS = new Set([
  'test',
  'example',
  'invalid',
  'local',
  'localhost',
  'onion',
]);
