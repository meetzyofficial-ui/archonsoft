import { whatsappLink } from "@/lib/site";

/** Always in reach: the conversation most visitors would rather have. */
export function WhatsAppButton({ label, text }: { label: string; text: string }) {
  return (
    <a href={whatsappLink(text)} target="_blank" rel="noopener noreferrer" aria-label={label} className="wa-button">
      <svg viewBox="0 0 24 24" aria-hidden="true" width="26" height="26" fill="currentColor">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15L2 22l5.1-1.5A9.93 9.93 0 1 0 12.04 2Zm0 1.8a8.13 8.13 0 1 1-4.4 15l-.3-.2-3 .9.9-2.9-.2-.3a8.12 8.12 0 0 1 7-12.5Zm-3.3 4.1c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.4 1 2.9.8 3.5.7.5 0 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4l-1.9-.9c-.3-.1-.5-.1-.7.2l-.8 1c-.1.2-.3.2-.6.1a7.4 7.4 0 0 1-3.6-3.2c-.2-.3 0-.5.1-.6l.5-.5.3-.5v-.5l-.9-2.1c-.2-.6-.5-.5-.6-.5l-.6-.1Z" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
