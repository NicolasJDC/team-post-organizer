// This edge function is no longer needed - secrets are now stored in app_settings table.
// Keeping as a no-op to avoid 404 errors from old clients.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(JSON.stringify({ error: 'Deprecated. Use app_settings table instead.' }), {
    status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
