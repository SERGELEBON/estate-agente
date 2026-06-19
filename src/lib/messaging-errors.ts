/**
 * Centralized user-friendly error helpers for the in-app messaging system.
 *
 * The goal: when a message send is refused (validation, auth, closed conversation,
 * not found, network, server error…), the CLIENT must understand WHAT went wrong
 * and WHAT TO DO next — without reading technical jargon.
 *
 * Every error response from messaging-related API routes returns this shape:
 *
 *   {
 *     error:   "Short human title",                 // e.g. "Message not sent"
 *     message: "Detailed explanation",               // e.g. "This conversation has been closed..."
 *     hint?:   "What the user should do next",       // e.g. "Open a new inquiry..."
 *     fields?: Record<string, string>,               // For validation: { visitorName: "..." }
 *     code?:   "VALIDATION_ERROR" | "UNAUTHORIZED" | ...
 *   }
 *
 * Client-side, `parseMessagingError(res)` extracts these fields, and
 * `showMessagingError(...)` displays them as a Sonner toast.
 */

import type { ZodError } from "zod";

export type MessagingErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "AUTH_REQUIRED"
  | "NOT_FOUND"
  | "CONVERSATION_CLOSED"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR";

export interface MessagingErrorResponse {
  error: string;
  message: string;
  hint?: string;
  fields?: Record<string, string>;
  code?: MessagingErrorCode;
}

/* ─── Field label mapping (for validation errors) ──────────────────── */

const FIELD_LABELS: Record<string, string> = {
  visitorName: "Your name",
  senderName: "Your name",
  visitorEmail: "Your email",
  senderEmail: "Your email",
  visitorPhone: "Your phone number",
  senderPhone: "Your phone number",
  subject: "Subject",
  body: "Message",
  propertyId: "Property",
  agentId: "Agent",
  token: "Conversation link",
  visitDate: "Visit date",
};

function humanizeField(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/* ─── Zod error → field-level human messages ────────────────────────── */

export function zodIssuesToFields(error: ZodError<any>): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString();
    if (!key) continue;
    // Keep the first message per field (most relevant)
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

/**
 * Convert field errors into a single readable sentence.
 * e.g. { visitorName: "Your name is required", body: "Message must be at least 5 characters" }
 *   → "Your name is required. Message must be at least 5 characters."
 */
export function fieldsToSentence(fields: Record<string, string>): string {
  return Object.values(fields).join(". ");
}

/* ─── Pre-built error responses (used by API routes) ───────────────── */

export const messagingErrors = {
  /** Auth required — agent/admin endpoints only */
  authRequired(): MessagingErrorResponse {
    return {
      error: "Sign-in required",
      message: "You need to be signed in to your account to perform this action.",
      hint: "Please sign in with your agent or admin account, then try again.",
      code: "AUTH_REQUIRED",
    };
  },

  /** Unauthorized — authenticated but not allowed to touch this conversation */
  unauthorized(): MessagingErrorResponse {
    return {
      error: "Not allowed",
      message: "You don't have permission to access this conversation.",
      hint: "Only the agent assigned to this inquiry (or an admin) can view and reply to it.",
      code: "UNAUTHORIZED",
    };
  },

  /** Visitor token missing or invalid */
  invalidVisitorToken(): MessagingErrorResponse {
    return {
      error: "Invalid conversation link",
      message: "We couldn't find this conversation. The link may be incomplete, expired, or already deleted.",
      hint: "Please go back to the property page and send a new message to start a fresh conversation.",
      code: "NOT_FOUND",
    };
  },

  /** Conversation not found (by id) */
  conversationNotFound(): MessagingErrorResponse {
    return {
      error: "Conversation not found",
      message: "This conversation no longer exists. It may have been deleted by the agent or admin.",
      hint: "Select another conversation from your inbox to continue chatting.",
      code: "NOT_FOUND",
    };
  },

  /** Conversation is closed — cannot send new messages */
  conversationClosed(by: "agent" | "visitor" = "agent"): MessagingErrorResponse {
    return by === "agent"
      ? {
          error: "Conversation closed",
          message: "This conversation has been closed by the agent and no longer accepts new messages.",
          hint: "You can still read all previous messages. If you have more questions, please send a new inquiry from the property page.",
          code: "CONVERSATION_CLOSED",
        }
      : {
          error: "Conversation closed",
          message: "This conversation has been closed and no longer accepts new messages.",
          hint: "Reopen the conversation from your inbox to continue chatting.",
          code: "CONVERSATION_CLOSED",
        };
  },

  /** Agent referenced in the inquiry does not exist */
  agentNotFound(): MessagingErrorResponse {
    return {
      error: "Agent unavailable",
      message: "The agent you are trying to contact is no longer available on our platform.",
      hint: "Please try again later, or contact us directly through the Contact page.",
      code: "NOT_FOUND",
    };
  },

  /** Property referenced does not exist */
  propertyNotFound(): MessagingErrorResponse {
    return {
      error: "Property unavailable",
      message: "The property you're asking about is no longer listed on our platform.",
      hint: "Browse our other available properties and contact the relevant agent from there.",
      code: "NOT_FOUND",
    };
  },

  /** Validation failed (Zod) — return field-level details */
  validationFailed(fields: Record<string, string>): MessagingErrorResponse {
    return {
      error: "Please check your information",
      message:
        Object.keys(fields).length > 0
          ? fieldsToSentence(fields)
          : "Some of the information you provided is incomplete or invalid.",
      hint: "Correct the highlighted fields below and try again.",
      fields,
      code: "VALIDATION_ERROR",
    };
  },

  /** Rate limited (placeholder for future) */
  rateLimited(): MessagingErrorResponse {
    return {
      error: "Too many messages",
      message: "You've sent several messages in a short period. Please wait a moment before sending another.",
      hint: "Try again in a few seconds.",
      code: "RATE_LIMITED",
    };
  },

  /** Generic server error */
  serverError(context: "create" | "send" | "fetch" | "update" = "send"): MessagingErrorResponse {
    const messages = {
      create: "We couldn't start your conversation due to a problem on our side.",
      send: "We couldn't deliver your message due to a problem on our side.",
      fetch: "We couldn't load your messages due to a problem on our side.",
      update: "We couldn't update this conversation due to a problem on our side.",
    };
    return {
      error: "Something went wrong",
      message: messages[context],
      hint: "Please try again in a moment. If the problem persists, refresh the page or contact support.",
      code: "SERVER_ERROR",
    };
  },

  /** Request body could not be parsed as JSON */
  malformedBody(): MessagingErrorResponse {
    return {
      error: "Invalid request",
      message: "The data sent to the server was not in the expected format.",
      hint: "Please refresh the page and try again.",
      code: "VALIDATION_ERROR",
    };
  },
} as const;

/* ─── Client-side helpers (for React components) ───────────────────── */

/**
 * Parse a fetch() Response into a MessagingErrorResponse.
 * Falls back gracefully if the server returned a plain string or nothing.
 */
export async function parseMessagingError(res: Response): Promise<MessagingErrorResponse> {
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  // Server returned our structured error
  if (payload && typeof payload === "object" && typeof payload.error === "string") {
    return {
      error: payload.error,
      message: payload.message ?? payload.error,
      hint: payload.hint,
      fields: payload.fields,
      code: payload.code,
    };
  }

  // Server returned a plain string error
  if (payload && typeof payload === "string") {
    return {
      error: "Message not sent",
      message: payload,
      code: "SERVER_ERROR",
    };
  }

  // Status-based fallbacks when body is unparseable
  if (res.status === 401) return messagingErrors.authRequired();
  if (res.status === 403) return messagingErrors.unauthorized();
  if (res.status === 404) return messagingErrors.conversationNotFound();
  if (res.status >= 500) return messagingErrors.serverError("send");

  return {
    error: "Message not sent",
    message: `The server returned an unexpected response (HTTP ${res.status}).`,
    hint: "Please try again in a moment.",
    code: "SERVER_ERROR",
  };
}

/**
 * Build a MessagingErrorResponse from a thrown network error
 * (fetch() rejected, connection refused, DNS failure, etc.).
 */
export function networkError(): MessagingErrorResponse {
  return {
    error: "Connection problem",
    message: "We couldn't reach our servers. This usually means your device is offline or the connection is unstable.",
    hint: "Please check your internet connection and try again. Your message has not been sent.",
    code: "NETWORK_ERROR",
  };
}
