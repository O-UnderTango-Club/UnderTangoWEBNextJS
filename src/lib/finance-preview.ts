// Server-only capability. The existing panel token never gains finance scope.
import { previewConfig } from "./panel-preview";

export function financePreviewConfig(env: NodeJS.ProcessEnv = process.env, now = Date.now()) {
  const panel = previewConfig(env,now); // Checks the exact branch and device-auth expiry.
  let value: unknown;
  try { value = JSON.parse(env.OPERATIONS_FINANCE_PREVIEW_CONFIG || ""); }
  catch { throw new Error("Falta configurar la lectura financiera de prueba."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Acceso financiero de prueba inválido.");
  const config = value as Record<string,unknown>;
  if (Object.keys(config).some(key => !["readToken","expiresAt"].includes(key))
    || typeof config.readToken !== "string" || !/^[a-f0-9]{64}$/.test(config.readToken)
    || [panel.readToken,panel.deviceSecret,panel.bootstrapHash].includes(config.readToken)
    || typeof config.expiresAt !== "number" || !Number.isSafeInteger(config.expiresAt)
    || config.expiresAt <= now || config.expiresAt > panel.expiresAt) {
    throw new Error("El acceso financiero de prueba no es válido o venció.");
  }
  return { url:"https://lqsnrqnmmeyzcnurfpos.supabase.co",key:panel.publishableKey,readToken:config.readToken,expiresAt:config.expiresAt };
}
