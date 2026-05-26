/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.frag' {
  const shader: string;
  export default shader;
}

declare module '*.vert' {
  const shader: string;
  export default shader;
}

interface PantheonSaveBridge {
  read(): string | null;
  write(payload: string): boolean;
  remove(): boolean;
}

interface PantheonNotifyPayload {
  title: string;
  body: string;
  /** Suppress the notification sound. */
  silent?: boolean;
}

interface PantheonNotifyBridge {
  isFocused(): boolean;
  show(payload: PantheonNotifyPayload): Promise<boolean>;
}

interface Window {
  pantheonSave?: PantheonSaveBridge;
  pantheonNotify?: PantheonNotifyBridge;
}
