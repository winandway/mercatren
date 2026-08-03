"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Proveedores del lado del navegador.
 * Aqui viven las cosas compartidas por toda la aplicacion: cache de datos,
 * carrito, avisos. Se crea un cliente por sesion de navegador, no uno global,
 * para que los datos de un usuario nunca se filtren a otro.
 */
export function Proveedores({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
