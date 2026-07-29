// Supabase Edge Function: send-push
//
// Recibe { house_id, title, body, exclude_user_id? }, resuelve los Expo push
// tokens de todos los miembros de esa casa (con el SERVICE_ROLE, saltándose RLS),
// excluye opcionalmente a un usuario y envía las notificaciones vía Expo Push API
// en lotes de <= 100.
//
// Deploy:  supabase functions deploy send-push
// Secrets: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY se inyectan automáticamente
//          en el entorno de la función; no hace falta setearlos a mano.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

interface SendPushBody {
  house_id: string;
  title: string;
  body: string;
  exclude_user_id?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { house_id, title, body, exclude_user_id } =
      (await req.json()) as SendPushBody;

    if (!house_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'house_id, title y body son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 0) AuthN/AuthZ: solo un miembro de la casa puede disparar pushes a esa casa.
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: 'Falta el header Authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: membership } = await admin
      .from('house_members')
      .select('user_id')
      .eq('house_id', house_id)
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'No es miembro de la casa' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1) Miembros de la casa (excluyendo opcionalmente a quien disparó el evento).
    let membersQuery = admin
      .from('house_members')
      .select('user_id')
      .eq('house_id', house_id);
    if (exclude_user_id) {
      membersQuery = membersQuery.neq('user_id', exclude_user_id);
    }
    const { data: members, error: membersError } = await membersQuery;
    if (membersError) throw membersError;

    const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'sin destinatarios' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Tokens de esos usuarios.
    const { data: tokenRows, error: tokensError } = await admin
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);
    if (tokensError) throw tokensError;

    const tokens = (tokenRows ?? [])
      .map((t: { token: string }) => t.token)
      .filter((t: string) => !!t);

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'sin tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3) Envío a la Expo Push API en lotes de <= 100.
    const tickets: unknown[] = [];
    for (const batch of chunk(tokens, BATCH_SIZE)) {
      const messages = batch.map((to) => ({
        to,
        sound: 'default',
        title,
        body,
      }));
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      const json = await res.json();
      tickets.push(json);
    }

    return new Response(JSON.stringify({ sent: tokens.length, tickets }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
