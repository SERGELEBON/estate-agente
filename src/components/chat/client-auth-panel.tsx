"use client";

import { AuthPanel } from "@/components/auth/auth-panel";

/** Client verification inside the chat: same form as everywhere, creating CLIENT accounts. */
export function ClientAuthPanel(props: {
  callbackUrl: string;
  onSignedIn?: () => void | Promise<void>;
  onBeforeGoogle?: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const { onBeforeGoogle, ...rest } = props;
  return <AuthPanel intent="client" onBeforeRedirect={onBeforeGoogle} {...rest} />;
}
