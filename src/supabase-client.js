(function initCrmSupabase(global) {
  const config = global.CRM_X_SUPABASE || {};
  const hasUrl = Boolean(config.url);
  const publicKey = config.publishableKey || config.anonKey || "";
  const hasPublicKey = Boolean(publicKey);
  const hasSdk = Boolean(global.supabase?.createClient);
  const isConfigured = hasUrl && hasPublicKey && hasSdk;

  const client = isConfigured
    ? global.supabase.createClient(config.url, publicKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

  global.crmSupabase = {
    client,
    url: config.url || "",
    isConfigured,
    missing: {
      url: !hasUrl,
      publicKey: !hasPublicKey,
      sdk: !hasSdk,
    },
  };
})(window);
