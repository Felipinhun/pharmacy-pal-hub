import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";
// @ts-ignore - virtual module
import { registerSW } from "virtual:pwa-register";

// Register Service Worker for PWA
registerSW({
  onNeedRefresh() {
    if (confirm("Nova versão do Bio Aurea disponível. Deseja atualizar?")) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log("App pronto para uso offline.");
  },
});

const router = getRouter();

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
