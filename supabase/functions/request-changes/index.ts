import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, postId, motivo, targetStatus, isAlteracao } = await req.json();

    if (!token || !postId || !motivo?.trim()) {
      return new Response(
        JSON.stringify({ error: "token, postId e motivo são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate the token
    const { data: link, error: linkError } = await supabase
      .from("presentation_links")
      .select("*")
      .eq("token", token)
      .single();

    if (linkError || !link) {
      return new Response(
        JSON.stringify({ error: "Apresentação não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Este link expirou" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the post belongs to this presentation's client
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, cliente_id, observacoes")
      .eq("id", postId)
      .eq("cliente_id", link.client_id)
      .single();

    if (postError || !post) {
      return new Response(
        JSON.stringify({ error: "Post não encontrado nesta apresentação" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const currentObs = post.observacoes || "";

    const updateData: Record<string, unknown> = {};

    if (isAlteracao) {
      // Alteração button: prepend "Alteração:" to the motivo in observações
      const observacoesAppend = `Alteração: ${motivo.trim()} (${timestamp})`;
      updateData.observacoes = currentObs ? `${currentObs}\n\n${observacoesAppend}` : observacoesAppend;
      updateData.motivo_alteracao = motivo.trim();
      updateData.alterado = true;
    } else {
      // Non-alteração button: just log the action
      const observacoesAppend = `📝 ${motivo.trim()} (${timestamp})`;
      updateData.observacoes = currentObs ? `${currentObs}\n\n${observacoesAppend}` : observacoesAppend;
    }

    // Move to target status if specified
    if (targetStatus) {
      updateData.status = targetStatus;
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", postId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Ação realizada com sucesso!" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
