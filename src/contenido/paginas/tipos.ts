import type { Bloque } from "@/contenido/docs/tipos";

/**
 * Una pagina de contenido: terminos, privacidad, quienes somos, ayuda…
 *
 * Reusa los mismos bloques que el documento del modelo de negocio
 * (`src/contenido/docs/tipos.ts`), asi que todo el sitio se ve igual y no hay
 * dos maneras de escribir un parrafo. Lo unico propio de estas paginas es la
 * cabecera y la fecha de vigencia.
 */
export type PaginaContenido = {
  titulo: string;
  /** Bajada bajo el titulo. Tambien se usa como meta description. */
  entradilla: string;
  /** "Vigente desde el 3 de agosto de 2026". Solo lo legal la necesita. */
  vigencia?: string;
  /** Indice lateral. Se muestra cuando hay mas de tres secciones. */
  indiceTitulo?: string;
  secciones: {
    id: string;
    numero?: string;
    titulo: string;
    bloques: Bloque[];
  }[];
  /**
   * Marca la pagina como preguntas frecuentes. Con esto, cada punto de lista
   * que tenga titulo se le entrega a Google como pregunta y respuesta, y las
   * puede mostrar desplegadas en los resultados.
   */
  esPreguntasFrecuentes?: boolean;
  /** Nota al pie, en letra chica. */
  cierre?: string;
};
