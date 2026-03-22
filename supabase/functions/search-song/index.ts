import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em músicas gospel/cristãs brasileiras. Quando o usuário buscar uma música, retorne informações sobre ela. Use tool calling para retornar os dados estruturados. Se não encontrar a música exata, sugira músicas similares.`,
          },
          {
            role: "user",
            content: `Busque informações sobre a música gospel/cristã: "${query}". Retorne os dados da música.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_songs",
              description: "Return a list of songs matching the search query",
              parameters: {
                type: "object",
                properties: {
                  songs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string", description: "Nome da música" },
                        artista: { type: "string", description: "Nome do artista/banda" },
                        album: { type: "string", description: "Nome do álbum" },
                        tom: { type: "string", description: "Tom da música (ex: C, D, E, G, A)" },
                        duracao: { type: "string", description: "Duração estimada (ex: 5:32)" },
                        bpm: { type: "string", description: "BPM estimado" },
                        classificacao: { type: "string", description: "Louvor, Adoração, Ofertório, etc" },
                        letra: { type: "string", description: "Letra completa da música se disponível" },
                      },
                      required: ["nome", "artista"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["songs"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_songs" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente mais tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao buscar músicas" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let songs = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        songs = parsed.songs || [];
      } catch {
        songs = [];
      }
    }

    return new Response(JSON.stringify({ songs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-song error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
