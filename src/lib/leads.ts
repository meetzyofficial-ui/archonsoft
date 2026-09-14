import { DEPARTMENTS, type DepartmentId } from "@/data/departments";

/**
 * The client brief, as a contract.
 *
 * What the world's offices collect and what the lead route accepts —
 * imported by both, so the form and the gate can never disagree. Like the
 * contact contract, validation returns keys, not sentences: the server does
 * not know which language the visitor read the questions in.
 */

export const TIMELINES = ["asap", "1-3m", "3-6m", "flexible"] as const;
export type Timeline = (typeof TIMELINES)[number];

export type LeadPayload = {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  department: DepartmentId;
  service: string;
  description: string;
  timeline?: Timeline | "";
  notes?: string;
  /** The visitor agreed to be contacted about this request. */
  consent: boolean;
  locale: "tr" | "en";
  device: "desktop" | "mobile";
  /** The path the visitor took through the world to get here. */
  journey?: string[];
  /** Hidden field. A bot filling it in is the only thing that ever will. */
  website?: string;
};

export type LeadErrorKey =
  | "name"
  | "nameLong"
  | "email"
  | "emailInvalid"
  | "company"
  | "phone"
  | "department"
  | "service"
  | "description"
  | "descriptionLong"
  | "timelineInvalid"
  | "notes"
  | "consent";

export type LeadErrors = Partial<Record<keyof LeadPayload, LeadErrorKey>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+\d][\d\s().-]{6,24}$/;

export function validateLead(input: Partial<LeadPayload>): LeadErrors {
  const errors: LeadErrors = {};

  const name = input.name?.trim() ?? "";
  if (name.length < 2) errors.name = "name";
  else if (name.length > 120) errors.name = "nameLong";

  const email = input.email?.trim() ?? "";
  if (!email) errors.email = "email";
  else if (!EMAIL.test(email) || email.length > 200) errors.email = "emailInvalid";

  if ((input.company?.trim().length ?? 0) > 160) errors.company = "company";

  for (const key of ["phone", "whatsapp"] as const) {
    const value = input[key]?.trim() ?? "";
    if (value && !PHONE.test(value)) errors[key] = "phone";
  }

  const department = DEPARTMENTS.find((one) => one.id === input.department);
  if (!department) errors.department = "department";
  else if (!department.services.some((one) => one.id === input.service)) errors.service = "service";

  const description = input.description?.trim() ?? "";
  if (description.length < 10) errors.description = "description";
  else if (description.length > 4000) errors.description = "descriptionLong";

  const timeline = input.timeline?.trim() ?? "";
  if (timeline && !TIMELINES.includes(timeline as Timeline)) errors.timeline = "timelineInvalid";

  if ((input.notes?.trim().length ?? 0) > 2000) errors.notes = "notes";

  if (input.consent !== true) errors.consent = "consent";

  return errors;
}

export const hasLeadErrors = (errors: LeadErrors) => Object.keys(errors).length > 0;

/** What the route answers. Nothing in it is secret; it says what happened. */
export type LeadResult = {
  ok: boolean;
  id?: string;
  stored?: "firestore" | "file" | "none";
  /** Where the record stands after the notifications went out. */
  status?: "new" | "notification_pending" | "notified" | "notification_partial" | "failed";
  notified?: { email: "sent" | "skipped" | "failed"; whatsapp: "sent" | "skipped" | "failed" | "mocked" };
  code?: string;
  errors?: LeadErrors;
};
