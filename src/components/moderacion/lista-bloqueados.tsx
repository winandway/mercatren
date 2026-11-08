"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { desbloquearVendedor } from "@/lib/moderacion/acciones";

import { olvidarBloqueados } from "@/lib/moderacion/estilo-bloqueados";

export function ListaBloqueados({
  inicial,
}: {
  inicial: Array<{ slug: string; nombre: string }>;
}) {
  const t = useTranslations("moderacion");
  const [lista, setLista] = useState(inicial);
  const [fallo, setFallo] = useState(false);
  const [enCurso, empezar] = useTransition();

  if (lista.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-borde bg-white p-6 text-center text-tinta-suave">
        {t("bloqueadosVacio")}
      </p>
    );
  }

  return (
    <>
      {fallo ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {t("errores.fallo")}
        </p>
      ) : null}
      <ul className="mt-6 divide-y divide-borde rounded-xl border border-borde bg-white">
        {lista.map((v) => (
          <li
            key={v.slug}
            className="flex items-center justify-between gap-3 p-4"
          >
            <span className="font-semibold">{v.nombre}</span>
            <button
              type="button"
              disabled={enCurso}
              onClick={() =>
                empezar(async () => {
                  const r = await desbloquearVendedor(v.slug).catch(() => ({
                    ok: false,
                  }));
                  if (!r.ok) {
                    setFallo(true);
                    return;
                  }
                  setFallo(false);
                  olvidarBloqueados();
                  setLista((l) => l.filter((x) => x.slug !== v.slug));
                })
              }
              className="rounded-lg border border-borde px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
            >
              {t("desbloquear")}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
