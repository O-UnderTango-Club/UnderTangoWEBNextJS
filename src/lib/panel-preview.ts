// Server-only, short-lived capability for this one preview branch.
export function isOperationsPreview(env: NodeJS.ProcessEnv = process.env) {
  return env.VERCEL_ENV === "preview" && env.VERCEL_GIT_COMMIT_REF === "codex/supabase-operativo-preview";
}
export function previewConfig(env: NodeJS.ProcessEnv = process.env, now = Date.now()) {
  if (!isOperationsPreview(env)) throw new Error("Acceso de prueba no disponible.");
  let value: any;
  try { value = JSON.parse(env.OPERATIONS_PREVIEW_CONFIG || ""); } catch { throw new Error("Falta configurar el acceso de prueba."); }
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      typeof value.publishableKey !== "string" || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(value.publishableKey) ||
      !["readToken", "deviceSecret", "bootstrapHash"].every(k => typeof value[k] === "string" && /^[a-f0-9]{64}$/.test(value[k])) ||
      !Number.isSafeInteger(value.expiresAt) || value.expiresAt <= now || value.expiresAt > now + 48*60*60*1000) {
    throw new Error("El acceso de prueba no es válido o venció.");
  }
  return value as { publishableKey: string; readToken: string; deviceSecret: string; bootstrapHash: string; expiresAt: number };
}
