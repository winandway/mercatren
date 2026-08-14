import { describe, expect, it } from "vitest";

import {
  DOMINIOS_DE_EJEMPLO,
  DOMINIOS_TEMPORALES,
  dominioDe,
  revisarPorLista,
} from "@/lib/validacion/correo-real";

/**
 * EL FILTRO DE CORREOS QUE NO EXISTEN.
 *
 * Lo que se vigila aquí es lo que se decide SIN red. La capa de DNS vive
 * aparte porque sale a Internet, y las pruebas del proyecto nunca le pegan a un
 * servicio real.
 */

describe("el dominio del correo", () => {
  it("se saca en minúsculas", () => {
    expect(dominioDe("Alguien@Gmail.COM")).toBe("gmail.com");
    expect(dominioDe("  alguien@gmail.com  ")).toBe("gmail.com");
  });

  it("lo que no es un correo devuelve null", () => {
    expect(dominioDe("sin-arroba")).toBeNull();
    expect(dominioDe("dos@arrobas@aqui")).toBeNull();
    expect(dominioDe("alguien@")).toBeNull();
    expect(dominioDe("")).toBeNull();
  });
});

describe("dominios de ejemplo", () => {
  it("se rechazan, porque no reciben correo ni pueden", () => {
    for (const dominio of DOMINIOS_DE_EJEMPLO) {
      const v = revisarPorLista(`alguien@${dominio}`);
      expect(v.ok, `${dominio} debería rechazarse`).toBe(false);
    }
  });

  it("da igual cómo se escriban las mayúsculas", () => {
    expect(revisarPorLista("USER@EXAMPLE.ORG").ok).toBe(false);
  });

  it("un dominio sin punto tampoco existe", () => {
    /* `root@localhost`, `a@intranet`. Se atrapa sin salir a preguntar: gastar
       la consulta de DNS en esto es gastarla para nada. */
    const v = revisarPorLista("root@localhost");
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.motivo).toBe("correoDeEjemplo");
  });
});

describe("correos temporales", () => {
  it("se rechazan con su propio motivo", () => {
    const v = revisarPorLista("spam@mailinator.com");
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.motivo).toBe("correoTemporal");
  });

  it("están todos los de la lista", () => {
    for (const dominio of DOMINIOS_TEMPORALES) {
      expect(revisarPorLista(`a@${dominio}`).ok, dominio).toBe(false);
    }
  });
});

describe("los correos de verdad pasan", () => {
  it("los grandes, sin tocarlos", () => {
    for (const correo of [
      "real@gmail.com",
      "real@hotmail.com",
      "real@yahoo.com",
      "alguien@mercatren.com",
      "compras@ferremateriales-bley.com",
    ]) {
      expect(revisarPorLista(correo).ok, correo).toBe(true);
    }
  });

  it("los que IMITAN a los grandes también pasan, y está bien", () => {
    /* `gmial.com` y `hotmial.com` existen y tienen servidor de correo.
       Cazarlos por parecido significaría rechazar dominios legítimos que se
       parecen a otro — y rechazar a un cliente real es mucho más caro que
       dejar entrar un correo que de todos modos se queda sin confirmar. */
    expect(revisarPorLista("alguien@gmial.com").ok).toBe(true);
    expect(revisarPorLista("alguien@hotmial.com").ok).toBe(true);
  });

  it("un dominio inventado pasa la LISTA — lo atrapa el DNS", () => {
    /* Las listas siempre se quedan cortas: los dominios inventados son
       infinitos. Por eso la capa que importa es la del DNS. */
    expect(revisarPorLista("asdf@asdfghjkl123456789.com").ok).toBe(true);
  });
});
