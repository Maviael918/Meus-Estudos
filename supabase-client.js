(function () {
  let clientPromise;
  let client;

  async function getClient() {
    if (clientPromise) return clientPromise;
    clientPromise = (async () => {
      const config = window.SUPABASE_CONFIG || {};
      if (!config.url || !config.anonKey) return null;

      const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      client = createClient(config.url, config.anonKey);
      return client;
    })();
    return clientPromise;
  }

  window.supabaseGame = {
    getClient,
    async signIn(email, password) {
      const supabase = await getClient();
      if (!supabase) throw new Error("Configure a URL e a chave pública do Supabase em supabase-config.js.");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    },
    async signUp(email, password) {
      const supabase = await getClient();
      if (!supabase) throw new Error("Configure a URL e a chave pública do Supabase em supabase-config.js.");
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    async signOut() {
      const supabase = await getClient();
      if (!supabase) return;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    async getSession() {
      const supabase = await getClient();
      if (!supabase) return null;
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    async loadCity(ownerId) {
      const supabase = await getClient();
      if (!supabase) throw new Error("Supabase não está configurado.");
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, state_version, game_state")
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async saveCity(name, gameState, baseMoney, baseMaterials, operationId) {
      const supabase = await getClient();
      if (!supabase) throw new Error("Supabase não está configurado.");
      const { data, error } = await supabase.rpc("save_city_state", {
        p_name: name,
        p_game_state: gameState,
        p_base_money: baseMoney,
        p_base_materials: baseMaterials,
        p_operation_id: operationId
      });
      if (error) throw error;
      return data;
    },
    async syncCityClock() {
      const supabase = await getClient();
      if (!supabase) throw new Error("Supabase não está configurado.");
      const { data, error } = await supabase.rpc("sync_city_clock");
      if (error) throw error;
<<<<<<< HEAD
      const { data: simulation, error: simulationError } = await supabase.rpc("process_city_simulation", {
        p_processed_days: data.processed_days
      });
      if (simulationError) throw simulationError;
      return {
        ...data,
        game_state: simulation.game_state,
        events: [...(Array.isArray(data.events) ? data.events : []), ...(Array.isArray(simulation.events) ? simulation.events : [])]
      };
=======
      return data;
>>>>>>> 46cdbbb6cba9dde98b3ab8c77259076d76e24196
    }
  };
})();
