import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { email, full_name, role, password } = await req.json()

    if (!email || !full_name || !role) {
      throw new Error('Dados incompletos (email, full_name, role são obrigatórios)')
    }

    console.log(`Criando usuário: ${email}, role: ${role}`)

    const createUserPayload: Record<string, unknown> = {
      email,
      email_confirm: true,
      user_metadata: { full_name },
    }

    if (password) {
      createUserPayload.password = password
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(createUserPayload)

    if (authError) throw authError

    const userId = authData.user.id

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([{ id: userId, full_name, email }], { onConflict: 'id' })

    if (profileError) throw profileError

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert([{ user_id: userId, role }])

    if (roleError) throw roleError

    return new Response(
      JSON.stringify({ success: true, userId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})