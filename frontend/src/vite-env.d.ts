/// <reference types="vite/client" />

// Allow TypeScript to accept side-effect CSS imports
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

