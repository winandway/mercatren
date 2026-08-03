# Datos fuente

Esta carpeta guarda los archivos de datos reales que se importan a la base.
**Su contenido NO se sube al repositorio** (ver `.gitignore`).

## Por qué no se suben

El repositorio de Mercatren tiene que ser **público** para que YaDominios Cloud
lo pueda publicar. Estos archivos traen datos reales de personas: nombres de
quienes pagaron, correos, montos, últimos dígitos de cuentas bancarias y
direcciones de las capturas de los comprobantes.

Nada de eso puede quedar en un repositorio público. Los datos viven **solo en la
base de datos**, donde hay que iniciar sesión para verlos.

## Qué archivo va aquí

| Archivo                               | Qué es                                                                |
| ------------------------------------- | --------------------------------------------------------------------- |
| `mercatren-zelle-history-export.json` | 743 movimientos ya procesados de la cuenta de prueba Bley Ferretería. |

## Cómo se importa

```bash
npm run zelle:importar      # arma el SQL a partir del archivo
npm run db:local            # crea la base local y mete migraciones + datos
```

El comando de importación **no toca ninguna base remota**. Para llevar estos
datos a producción hace falta autorización expresa del dueño, y se hace aparte.

## Reglas de estos datos

- Son **históricos y congelados**: ya fueron procesados, no se vuelven a tocar.
- Las **imágenes no se migran**: cada registro trae la dirección pública de su
  captura en el almacenamiento original y se muestra desde ahí.
- **Contabilidad: solo suman las entradas.** Los retiros (`tipo = retiro`) se
  guardan y se listan, pero nunca entran en un total.
- Números de control del archivo: **666 entradas aprobadas por $337,261.22**,
  más 5 rechazadas y 2 pendientes.
