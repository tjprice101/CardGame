/// <reference types="vite/client" />

declare module '*.frag' {
  const shader: string;
  export default shader;
}

declare module '*.vert' {
  const shader: string;
  export default shader;
}

interface HeavenlySaveBridge {
  read(): string | null;
  write(payload: string): boolean;
  remove(): boolean;
}

interface Window {
  heavenlySave?: HeavenlySaveBridge;
}
