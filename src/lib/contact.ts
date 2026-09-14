/**
 * Shared contact-form contract, imported by both the form and the route so the
 * two can never drift apart.
 *
 * Validation returns error *keys* rather than sentences: the same rules have to
 * run on the server, which has no idea which language the visitor is reading,
 * and the client turns the key into a message from its own dictionary.
 */

export const PROJECT_TYPES = [
  "product",
  "web",
  "mobile",
  "saas",
  "business",
  "commerce",
  "ai",
  "automation",
  "custom",
  "unsure",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  projectType: string;
  message: string;
  /** Hidden field. A bot filling it in is the only thing that ever will. */
  website?: string;
};

export type ErrorKey =
  | "name"
  | "nameLong"
  | "email"
  | "emailInvalid"
  | "company"
  | "type"
  | "typeInvalid"
  | "message"
  | "messageLong";

export type FieldErrors = Partial<Record<keyof ContactPayload, ErrorKey>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Runs on the client for instant feedback and on the server as the gate. */
export function validateContact(input: Partial<ContactPayload>): FieldErrors {
  const errors: FieldErrors = {};

  const name = input.name?.trim() ?? "";
  if (name.length < 2) errors.name = "name";
  else if (name.length > 120) errors.name = "nameLong";

  const email = input.email?.trim() ?? "";
  if (!email) errors.email = "email";
  else if (!EMAIL.test(email) || email.length > 200) errors.email = "emailInvalid";

  if ((input.company?.trim().length ?? 0) > 160) errors.company = "company";

  const projectType = input.projectType?.trim() ?? "";
  if (!projectType) errors.projectType = "type";
  else if (!PROJECT_TYPES.includes(projectType as ProjectType)) errors.projectType = "typeInvalid";

  const message = input.message?.trim() ?? "";
  if (message.length < 20) errors.message = "message";
  else if (message.length > 5000) errors.message = "messageLong";

  return errors;
}

export const hasErrors = (errors: FieldErrors): boolean => Object.keys(errors).length > 0;
