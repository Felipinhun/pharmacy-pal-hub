import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Create User (Bypass RLS and manage Auth)
  app.post("/api/admin/create-user", async (req, res) => {
    const { email, full_name, role } = req.body;

    try {
      // Import dinâmico para garantir que só rode no servidor
      const { supabaseAdmin } = await import("./src/integrations/supabase/client.server.js");

      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name }
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // 2. Criar Perfil
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert([{ id: userId, full_name, email }]);

      if (profileError) throw profileError;

      // 3. Atribuir Papel (Role)
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert([{ user_id: userId, role }]);

      if (roleError) throw roleError;

      res.status(200).json({ success: true, userId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro no Admin Create User:", errorMessage);
      res.status(500).json({ 
        success: false, 
        message: errorMessage
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
