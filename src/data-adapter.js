(function initCrmDataAdapter(global) {
  const storage = global.crmStorage;
  const supabaseState = global.crmSupabase || {};
  const supabaseClient = supabaseState.client;

  if (!storage) {
    throw new Error("CRM-X storage layer is not loaded. Check src/storage.js script order before src/data-adapter.js.");
  }

  const localStateAdapter = {
    mode: "local",
    loadState(key, fallback) {
      return storage.getJson(key, fallback);
    },
    saveState(key, value) {
      storage.setJson(key, value);
    },
  };

  const supabaseTableAdapter = {
    mode: "supabase",
    isReady: Boolean(supabaseClient),
    async list(table, columns = "*") {
      if (!supabaseClient) return { data: [], error: new Error("Supabase is not configured") };
      return supabaseClient.from(table).select(columns);
    },
    async getById(table, id, columns = "*") {
      if (!supabaseClient) return { data: null, error: new Error("Supabase is not configured") };
      return supabaseClient.from(table).select(columns).eq("id", id).single();
    },
    async insert(table, record) {
      if (!supabaseClient) return { data: null, error: new Error("Supabase is not configured") };
      return supabaseClient.from(table).insert(record).select().single();
    },
    async update(table, id, patch) {
      if (!supabaseClient) return { data: null, error: new Error("Supabase is not configured") };
      return supabaseClient.from(table).update(patch).eq("id", id).select().single();
    },
    async remove(table, id) {
      if (!supabaseClient) return { error: new Error("Supabase is not configured") };
      return supabaseClient.from(table).delete().eq("id", id);
    },
  };

  global.crmDataAdapter = {
    mode: supabaseClient ? "hybrid" : "local",
    isSupabaseReady: Boolean(supabaseClient),
    supabaseMissing: supabaseState.missing || {},
    localState: localStateAdapter,
    supabaseTables: supabaseTableAdapter,
  };
})(window);
