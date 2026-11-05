import type { PaginaContenido } from "./tipos";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { SOCIEDAD } from "@/lib/sociedad";

/**
 * LOS TEXTOS LEGALES PROPIOS DE CADA PAÍS (5 nov 2026, Fase 5).
 *
 * Los términos y la privacidad de siempre son los de Estados Unidos. España y
 * Venezuela necesitan lo suyo: en España la ley de consumo obliga a decir
 * quién vende (con su número fiscal español y su representante), el
 * desistimiento de 14 días, la garantía de 3 años, los tribunales del
 * consumidor y el representante en la UE para los datos; en Venezuela hay que
 * decir quién vende, dónde se retira y que la ley venezolana protege a quien
 * compra. La base legal de cada frase está en `docs/paises/`.
 *
 * ══ NO SE PUBLICAN A MEDIAS ══
 * Cada país tiene sus datos (los que solo Richard puede dar) y la marca
 * `revisadoPorAbogado`. Mientras falte algo, las secciones NO salen: un texto
 * legal con «[domicilio]» o sin la revisión del abogado es peor que ninguno.
 * Y el candado de `tests/unit/legales-por-pais.test.ts` no deja encender un
 * país en la app (ni abrir el cobro de España) sin sus textos listos.
 */

type Seccion = PaginaContenido["secciones"][number];
type Idioma = "es" | "en";

export type DatosLegalesEspana = {
  revisadoPorAbogado: boolean;
  /** El NIF que asigne la Agencia Tributaria a la sociedad (modelo 036). */
  nifEspana: string | null;
  /** Nombre y domicilio del representante fiscal en España (art. 164 LIVA). */
  representanteFiscal: string | null;
  /** Nombre, dirección en España y correo del representante del RGPD (art. 27). */
  representanteUE: string | null;
  /** Domicilio y teléfono que se publican (LSSI art. 10, TRLGDCU art. 97). */
  domicilioPublicado: string | null;
  telefonoPublicado: string | null;
  /** Quién paga la devolución por desistimiento (TRLGDCU art. 108). */
  devolucionPaga: "comprador" | "mercatren" | null;
  /** En cuántos días se contesta un reclamo. */
  diasParaResponder: number | null;
};

export type DatosLegalesVenezuela = {
  revisadoPorAbogado: boolean;
};

/** Hoy: nada decidido. Se llenan con lo que diga Richard y revise el abogado. */
export const LEGALES_ES: DatosLegalesEspana = {
  revisadoPorAbogado: false,
  nifEspana: null,
  representanteFiscal: null,
  representanteUE: null,
  domicilioPublicado: null,
  telefonoPublicado: null,
  devolucionPaga: null,
  diasParaResponder: null,
};

export const LEGALES_VE: DatosLegalesVenezuela = {
  revisadoPorAbogado: false,
};

export function legalesDeEspanaListos(d: DatosLegalesEspana): boolean {
  return (
    d.revisadoPorAbogado &&
    Boolean(
      d.nifEspana?.trim() &&
      d.representanteFiscal?.trim() &&
      d.representanteUE?.trim() &&
      d.domicilioPublicado?.trim() &&
      d.telefonoPublicado?.trim(),
    ) &&
    d.devolucionPaga !== null &&
    (d.diasParaResponder ?? 0) > 0
  );
}

export function legalesDeVenezuelaListos(d: DatosLegalesVenezuela): boolean {
  return d.revisadoPorAbogado;
}

/** ¿Este país ya puede enseñar sus textos legales propios? */
export function legalesListos(
  pais: string,
  datos: { ES: DatosLegalesEspana; VE: DatosLegalesVenezuela } = {
    ES: LEGALES_ES,
    VE: LEGALES_VE,
  },
): boolean {
  const codigo = pais.trim().toUpperCase();
  if (codigo === "ES") return legalesDeEspanaListos(datos.ES);
  if (codigo === "VE") return legalesDeVenezuelaListos(datos.VE);
  /* Estados Unidos usa los textos de siempre; los demás no tienen propios. */
  return codigo === "US";
}

/* ════════════════════════ ESPAÑA · TÉRMINOS ════════════════════════ */

export function terminosDeEspana(
  d: DatosLegalesEspana,
  idioma: Idioma,
): Seccion[] {
  const es = idioma === "es";
  const devolucion =
    d.devolucionPaga === "mercatren"
      ? es
        ? "el coste de devolverlo corre de nuestra cuenta"
        : "we cover the cost of sending it back"
      : es
        ? "el coste directo de devolverlo corre de tu cuenta"
        : "the direct cost of sending it back is yours";
  const dias = d.diasParaResponder ?? 0;
  return [
    {
      id: "espana",
      mercados: ["ES"],
      numero: "",
      titulo: es
        ? "Si compras en Mercatren España"
        : "If you shop at Mercatren Spain",
      bloques: [
        {
          tipo: "aviso",
          tono: "acento",
          titulo: es
            ? "Para quien compra con entrega en España"
            : "For purchases delivered in Spain",
          parrafos: [
            es
              ? "Lo que dice esta sección se aplica a las compras con entrega en España y prevalece sobre cualquier otra parte de estos términos que diga algo distinto, incluidas las que hablan de Estados Unidos."
              : "This section applies to purchases delivered in Spain and prevails over any other part of these terms that says otherwise, including the parts about the United States.",
          ],
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: es ? "Quién vende" : "Who sells",
              texto: es
                ? `vende ${SOCIEDAD.nombre}, sociedad de responsabilidad limitada constituida en el estado de Michigan (Estados Unidos), inscrita con el número ${SOCIEDAD.registro}, con domicilio en ${d.domicilioPublicado}, teléfono ${d.telefonoPublicado} y correo ${CORREO_CONTACTO}. NIF en España: ${d.nifEspana}. Representante fiscal en España: ${d.representanteFiscal}.`
                : `${SOCIEDAD.nombre} sells, a limited liability company organized in the State of Michigan (United States), registered under number ${SOCIEDAD.registro}, located at ${d.domicilioPublicado}, phone ${d.telefonoPublicado}, email ${CORREO_CONTACTO}. Spanish tax ID (NIF): ${d.nifEspana}. Tax representative in Spain: ${d.representanteFiscal}.`,
            },
            {
              titulo: es ? "Cómo es la venta" : "How the sale works",
              texto: es
                ? `${SOCIEDAD.nombre} compra el producto al comercio español que lo publica y te lo vende a ti. El comercio lo envía a tu dirección en España.`
                : `${SOCIEDAD.nombre} buys the product from the Spanish business that lists it and sells it to you. The business ships it to your address in Spain.`,
            },
            {
              titulo: es ? "El precio" : "The price",
              texto: es
                ? "los precios están en euros e incluyen el IVA. Los gastos de envío, si los hay, se muestran antes de confirmar el pedido."
                : "prices are in euros and include VAT. Shipping costs, if any, are shown before you confirm your order.",
            },
            {
              titulo: es ? "Cómo se compra" : "How to buy",
              texto: es
                ? "eliges el producto, revisas tus datos y el total, y confirmas con el botón de pago. Puedes corregir tus datos antes de confirmar. Guardamos el contrato y lo ves en «Mis pedidos». Puedes contratar en español o en inglés, y te confirmamos el pedido por correo."
                : 'choose the product, review your details and the total, and confirm with the pay button. You can correct your details before confirming. We keep a record of the contract, which you can see in "My orders". You can contract in Spanish or English, and we confirm your order by email.',
            },
          ],
        },
        {
          tipo: "subtitulo",
          texto: es
            ? "Tu derecho a desistir en 14 días"
            : "Your 14-day right of withdrawal",
        },
        {
          tipo: "parrafo",
          texto: es
            ? `Tienes 14 días naturales para desistir de la compra sin dar motivos, contados desde que tú, o la persona que indiques (que no sea el transportista), recibe el producto. Avísanos desde «Mis pedidos», con el formulario de abajo o escribiendo a ${CORREO_CONTACTO}. Te devolvemos todo lo pagado, incluido el envío estándar, en un máximo de 14 días desde tu aviso y por el mismo medio de pago; podemos esperar a recibir el producto o la prueba de que lo enviaste. Tienes 14 días para devolverlo, y ${devolucion}.`
            : `You have 14 calendar days to withdraw from your purchase without giving a reason, counted from the day you, or a person you name (other than the carrier), receive the product. Let us know from "My orders", with the form below, or by writing to ${CORREO_CONTACTO}. We refund everything you paid, including standard shipping, within 14 days of your notice and using the same payment method; we may wait until we receive the product or proof that you sent it. You have 14 days to send it back, and ${devolucion}.`,
        },
        {
          tipo: "parrafo",
          texto: es
            ? "No se puede desistir de productos hechos a tu medida o personalizados, de los que se estropean o caducan rápido, ni de los precintados por salud o higiene que se hayan abierto después de la entrega."
            : "The right of withdrawal doesn't apply to custom-made or personalized products, to goods that spoil or expire quickly, or to goods sealed for health or hygiene reasons once unsealed after delivery.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: es
            ? "Modelo de formulario de desistimiento"
            : "Model withdrawal form",
          parrafos: es
            ? [
                "(Solo debe cumplimentar y enviar el presente formulario si desea desistir del contrato.)",
                `A la atención de ${SOCIEDAD.nombre}, ${d.domicilioPublicado}, ${CORREO_CONTACTO}:`,
                "Por la presente le comunico/comunicamos (*) que desisto de mi/desistimos de nuestro (*) contrato de venta del siguiente bien/prestación del siguiente servicio (*):",
                "Pedido el/recibido el (*):",
                "Nombre del consumidor o de los consumidores:",
                "Domicilio del consumidor o de los consumidores:",
                "Firma del consumidor o de los consumidores (solo si el presente formulario se presenta en papel):",
                "Fecha:",
                "(*) Táchese lo que no proceda.",
              ]
            : [
                "(Complete and return this form only if you wish to withdraw from the contract.)",
                `To ${SOCIEDAD.nombre}, ${d.domicilioPublicado}, ${CORREO_CONTACTO}:`,
                "I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods/for the provision of the following service (*):",
                "Ordered on/received on (*):",
                "Name of consumer(s):",
                "Address of consumer(s):",
                "Signature of consumer(s) (only if this form is submitted on paper):",
                "Date:",
                "(*) Delete as appropriate.",
              ],
        },
        {
          tipo: "subtitulo",
          texto: es ? "La garantía" : "The guarantee",
        },
        {
          tipo: "parrafo",
          texto: es
            ? "Respondemos de cualquier falta de conformidad que exista al entregarte el producto y se manifieste en los 3 años siguientes. Si aparece en los 2 primeros años, se presume que ya existía. En productos de segunda mano, el plazo es el que indique su ficha, nunca menor de 1 año."
            : "We are responsible for any lack of conformity that exists when the product is delivered and becomes apparent within the following 3 years. If it appears within the first 2 years, it is presumed to have existed at delivery. For second-hand goods, the period is the one stated on the product page, never less than 1 year.",
        },
        {
          tipo: "subtitulo",
          texto: es
            ? "Ley, tribunales y reclamos"
            : "Law, courts and complaints",
        },
        {
          tipo: "parrafo",
          texto: es
            ? `Si eres consumidor con residencia en España, tienes la protección de la ley española que no se puede excluir por contrato, y puedes reclamar ante los tribunales de tu domicilio. Puedes reclamarnos en ${CORREO_CONTACTO}; contestamos en un máximo de ${dias} días. Hoy no estamos adheridos a ningún sistema de resolución alternativa de litigios.`
            : `If you are a consumer residing in Spain, you keep the protection of Spanish law that cannot be waived by contract, and you can bring a claim before the courts where you live. You can send us a complaint at ${CORREO_CONTACTO}; we reply within ${dias} days. We are not currently part of any alternative dispute resolution scheme.`,
        },
      ],
    },
  ];
}

/* ════════════════════════ ESPAÑA · PRIVACIDAD ════════════════════════ */

export function privacidadDeEspana(
  d: DatosLegalesEspana,
  idioma: Idioma,
): Seccion[] {
  const es = idioma === "es";
  return [
    {
      id: "espana",
      mercados: ["ES"],
      numero: "",
      titulo: es
        ? "Si usas Mercatren desde España"
        : "If you use Mercatren from Spain",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: es
                ? "Responsable y representante"
                : "Controller and representative",
              texto: es
                ? `responsable: ${SOCIEDAD.nombre} (Michigan, Estados Unidos), ${CORREO_CONTACTO}. Representante en la Unión Europea: ${d.representanteUE}.`
                : `controller: ${SOCIEDAD.nombre} (Michigan, United States), ${CORREO_CONTACTO}. Representative in the European Union: ${d.representanteUE}.`,
            },
            {
              titulo: es
                ? "Para qué y con qué base"
                : "Purposes and legal bases",
              texto: es
                ? "usamos tus datos para cumplir el contrato de compra (art. 6.1.b del RGPD), cumplir obligaciones legales, como las fiscales en España (art. 6.1.c), y prevenir el fraude en los pagos, por interés legítimo (art. 6.1.f)."
                : "we use your data to perform the purchase contract (GDPR art. 6(1)(b)), to meet legal obligations such as tax obligations in Spain (art. 6(1)(c)), and to prevent payment fraud, based on legitimate interest (art. 6(1)(f)).",
            },
            {
              titulo: es ? "Quién los recibe" : "Who receives them",
              texto: es
                ? "el comercio que envía tu pedido (nombre, dirección, teléfono y qué compraste); el procesador de pagos; los proveedores de alojamiento y correo; y la Agencia Tributaria cuando la ley lo exige."
                : "the business that ships your order (name, address, phone number and what you bought); the payment processor; our hosting and email providers; and the Spanish Tax Agency when the law requires it.",
            },
            {
              titulo: es
                ? "Datos tratados en Estados Unidos"
                : "Data processed in the United States",
              texto: es
                ? "tus datos se tratan en los Estados Unidos. Los proveedores que los reciben allí están adheridos al Marco de Privacidad de Datos UE-EE. UU., reconocido por la Comisión Europea el 10 de julio de 2023, o firman las cláusulas contractuales tipo de la Comisión. Puedes pedirnos una copia de esas garantías."
                : "your data is processed in the United States. The providers that receive it there are certified under the EU-U.S. Data Privacy Framework, recognized by the European Commission on July 10, 2023, or have signed the Commission's standard contractual clauses. You can ask us for a copy of those safeguards.",
            },
            {
              titulo: es ? "Tus derechos" : "Your rights",
              texto: es
                ? "puedes pedir acceso, rectificación, supresión, limitación, oposición y portabilidad. Si no te atendemos bien, puedes reclamar ante la Agencia Española de Protección de Datos."
                : "you can ask for access, rectification, erasure, restriction, objection and portability. If we don't handle your request properly, you can file a complaint with the Spanish Data Protection Agency (AEPD).",
            },
            {
              titulo: es ? "Cookies" : "Cookies",
              texto: es
                ? "usamos tres cookies técnicas: la de tu sesión, la de tu idioma y la del país que eliges con la bandera. No necesitan tu consentimiento porque las pides tú para usar el servicio. No usamos cookies de publicidad ni de analítica."
                : "we use three technical cookies: your session, your language and the country you pick with the flag. They don't require your consent because you request them to use the service. We don't use advertising or analytics cookies.",
            },
            {
              titulo: es ? "Edad" : "Age",
              texto: es
                ? "para crear una cuenta hay que tener al menos 14 años; para comprar, la edad que exija la ley para contratar."
                : "you must be at least 14 to create an account; to buy, you must be of legal age to enter into a contract.",
            },
          ],
        },
      ],
    },
  ];
}

/* ════════════════════════ VENEZUELA ════════════════════════ */

export function terminosDeVenezuela(idioma: Idioma): Seccion[] {
  const es = idioma === "es";
  return [
    {
      id: "venezuela",
      mercados: ["VE"],
      numero: "",
      titulo: es
        ? "Si compras en Mercatren Venezuela"
        : "If you shop at Mercatren Venezuela",
      bloques: [
        {
          tipo: "aviso",
          tono: "acento",
          titulo: es
            ? "Para quien compra en mercatren.com.ve"
            : "For purchases on mercatren.com.ve",
          parrafos: [
            es
              ? "Lo que dice esta sección se aplica a las compras en mercatren.com.ve y prevalece sobre cualquier otra parte de estos términos que diga algo distinto, incluidas las que hablan de Estados Unidos."
              : "This section applies to purchases on mercatren.com.ve and prevails over any other part of these terms that says otherwise, including the parts about the United States.",
          ],
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: es
                ? "Quién vende y dónde se entrega"
                : "Who sells and where you get it",
              texto: es
                ? `en mercatren.com.ve vende ${SOCIEDAD.nombre}, sociedad registrada en Michigan, Estados Unidos. Los productos los publica un comercio de Venezuela: ${SOCIEDAD.nombre} le compra la mercancía a ese comercio y te la vende a ti. La mercancía se retira en el comercio indicado en cada producto, en Venezuela, salvo que el comercio ofrezca despacho y lo diga en la ficha.`
                : `on mercatren.com.ve, ${SOCIEDAD.nombre} sells, a company registered in Michigan, United States. Products are listed by a business in Venezuela: ${SOCIEDAD.nombre} buys the goods from that business and sells them to you. Goods are picked up at the business shown on each product, in Venezuela, unless the business offers delivery and says so on the product page.`,
            },
            {
              titulo: es ? "El precio" : "The price",
              texto: es
                ? "el precio se publica en dólares de los Estados Unidos y es el precio final: no se cobra ningún recargo aparte al pagar ni al retirar."
                : "prices are listed in US dollars and are final: no extra charge is added at checkout or at pickup.",
            },
            {
              titulo: es ? "Cómo se paga" : "How you pay",
              texto: es
                ? "se paga con tarjeta o por Zelle desde una cuenta a tu nombre; el pago se recibe en Estados Unidos, en dólares."
                : "you pay by card or by Zelle from an account in your name; payment is received in the United States, in US dollars.",
            },
            {
              titulo: es ? "La garantía" : "The guarantee",
              texto: es
                ? "los equipos y artefactos con piezas mecánicas, eléctricas o electrónicas tienen la garantía que se indica en su ficha, con quién la da y dónde se hace valer."
                : "equipment and appliances with mechanical, electrical or electronic parts carry the guarantee stated on their product page, including who provides it and where to claim it.",
            },
            {
              titulo: es ? "Ley aplicable" : "Governing law",
              texto: es
                ? "tu compra se rige por estos términos y por las leyes de los Estados Unidos y del estado de Michigan, sin perjuicio de los derechos que la ley venezolana reconoce a quienes adquieren bienes en Venezuela y que no se pueden renunciar."
                : "your purchase is governed by these terms and by the laws of the United States and the State of Michigan, without prejudice to the rights that Venezuelan law grants to people who acquire goods in Venezuela and that cannot be waived.",
            },
            {
              titulo: es ? "Reclamos" : "Complaints",
              texto: es
                ? `escríbenos primero a ${CORREO_CONTACTO}. Si no quedas conforme, conservas los mecanismos de reclamo que te da la ley venezolana.`
                : `write to us first at ${CORREO_CONTACTO}. If you're not satisfied, you keep the complaint channels that Venezuelan law gives you.`,
            },
          ],
        },
      ],
    },
  ];
}

export function privacidadDeVenezuela(idioma: Idioma): Seccion[] {
  const es = idioma === "es";
  return [
    {
      id: "venezuela",
      mercados: ["VE"],
      numero: "",
      titulo: es
        ? "Si usas Mercatren Venezuela"
        : "If you use Mercatren Venezuela",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: es
                ? "Dónde se tratan tus datos"
                : "Where your data is processed",
              texto: es
                ? `si compras o vendes en mercatren.com.ve, tus datos los trata ${SOCIEDAD.nombre} en los Estados Unidos, solo para prestar el servicio, cobrar, entregar y cumplir la ley. Al crear tu cuenta aceptas ese tratamiento, y puedes retirar tu consentimiento cerrando tu cuenta.`
                : `if you buy or sell on mercatren.com.ve, your data is processed by ${SOCIEDAD.nombre} in the United States, only to provide the service, take payment, deliver and comply with the law. By creating an account you agree to that processing, and you can withdraw your consent by closing your account.`,
            },
            {
              titulo: es
                ? "Qué recibe el comercio"
                : "What the business receives",
              texto: es
                ? "para el retiro, el comercio recibe el nombre de quien retira, su teléfono y qué se compró. No recibe tu comprobante de pago ni tus datos bancarios."
                : "for pickup, the business receives the name of the person picking up, their phone number and what was bought. It doesn't receive your proof of payment or your bank details.",
            },
            {
              titulo: es ? "Tus derechos" : "Your rights",
              texto: es
                ? `puedes pedirnos acceso, rectificación o supresión de tus datos, y saber qué uso les damos, en ${CORREO_CONTACTO}.`
                : `you can ask us for access to, correction or deletion of your data, and how we use it, at ${CORREO_CONTACTO}.`,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Las secciones legales propias del país, SOLO si están listas. Hoy devuelve
 * siempre la lista vacía: falta lo de Richard y el abogado.
 */
export function seccionesLegalesDelPais(
  pagina: "terminos" | "privacidad",
  pais: string,
  idioma: Idioma,
  datos: { ES: DatosLegalesEspana; VE: DatosLegalesVenezuela } = {
    ES: LEGALES_ES,
    VE: LEGALES_VE,
  },
): Seccion[] {
  const codigo = pais.trim().toUpperCase();
  if (codigo === "ES" && legalesDeEspanaListos(datos.ES)) {
    return pagina === "terminos"
      ? terminosDeEspana(datos.ES, idioma)
      : privacidadDeEspana(datos.ES, idioma);
  }
  if (codigo === "VE" && legalesDeVenezuelaListos(datos.VE)) {
    return pagina === "terminos"
      ? terminosDeVenezuela(idioma)
      : privacidadDeVenezuela(idioma);
  }
  return [];
}

/** La página con las secciones del país al final (numeradas en su sitio). */
export function conLegalesDelPais(
  base: PaginaContenido,
  pagina: "terminos" | "privacidad",
  pais: string,
  idioma: Idioma,
): PaginaContenido {
  const propias = seccionesLegalesDelPais(pagina, pais, idioma);
  if (propias.length === 0) return base;
  const numeradas = base.secciones.some((s) => s.numero);
  const siguiente = base.secciones.length + 1;
  return {
    ...base,
    secciones: [
      ...base.secciones,
      ...propias.map((s, i) => ({
        ...s,
        numero: numeradas ? String(siguiente + i) : undefined,
      })),
    ],
  };
}
