-- ═══════════════════════════════════════════════════════════════════════════
-- VENEZUELA SE MUDA A mercatren.com.ve
--
-- Escrito el 6 sep 2026. NO SE EJECUTA HASTA QUE RICHARD LO AUTORICE, y se
-- ejecuta el mismo día que el DNS apunte (lunes 8 sep), no antes: en cuanto
-- estas filas digan `VE`, los productos venezolanos DESAPARECEN de
-- mercatren.com, y si el dominio nuevo todavía no responde no quedan en
-- ninguna parte.
--
-- Qué hace: mover al mercado VE lo que ya es venezolano por su país de
-- origen. No cambia un solo precio, ni un pedido pagado, ni un saldo.
--
-- Cómo se comprueba ANTES (las tres consultas de arriba) y DESPUÉS (las dos
-- de abajo). Se miran los números, no se supone.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ANTES: qué se va a mover ──────────────────────────────────────────────
-- Esperado el 6 sep 2026: 6 comercios (Bley Ferretería, Inversiones
-- multiservicios AC0803, Brillox Steel, MAXIUM, MEGAYES, Variedades COLOMBIA
-- NEXT) y ~1.018 productos.
SELECT 'tiendas a mover' AS que, COUNT(*) AS n
  FROM tiendas WHERE UPPER(TRIM(COALESCE(pais_origen,''))) = 'VE' AND mercado <> 'VE';

SELECT 'productos que se van con ellas' AS que, COUNT(*) AS n
  FROM productos p JOIN tiendas t ON t.id = p.tienda_id
 WHERE UPPER(TRIM(COALESCE(t.pais_origen,''))) = 'VE';

SELECT t.slug, t.nombre, t.ciudad, t.mercado, COUNT(p.id) AS productos
  FROM tiendas t LEFT JOIN productos p ON p.tienda_id = t.id
 WHERE UPPER(TRIM(COALESCE(t.pais_origen,''))) = 'VE'
 GROUP BY t.id ORDER BY productos DESC;

-- ── EL CAMBIO ─────────────────────────────────────────────────────────────
-- 1) Las tiendas venezolanas pasan al mercado VE.
--    El criterio es `pais_origen`, que es el dato duro (de dónde SALE la
--    mercancía), nunca una lista de slugs escrita a mano: una lista se queda
--    vieja el día que entre el séptimo comercio.
UPDATE tiendas
   SET mercado = 'VE'
 WHERE UPPER(TRIM(COALESCE(pais_origen,''))) = 'VE';

-- 2) Los pedidos YA HECHOS de esos comercios se mudan con ellos, para que el
--    panel filtrado por país no los esconda. Un pedido que desaparece de
--    todas las pantallas es dinero que nadie puede atender.
--    Se mueven solo los que llevan producto de una tienda venezolana.
UPDATE pedidos
   SET mercado = 'VE'
 WHERE id IN (
   SELECT DISTINCT ip.pedido_id
     FROM items_pedido ip
     JOIN productos p ON p.id = ip.producto_id
     JOIN tiendas t   ON t.id = p.tienda_id
    WHERE UPPER(TRIM(COALESCE(t.pais_origen,''))) = 'VE'
 );

-- ── DESPUÉS: comprobar ────────────────────────────────────────────────────
-- Esperado: la fila VE con 6 tiendas, y NINGUNA tienda con pais_origen VE
-- fuera del mercado VE.
SELECT mercado, pais_origen, COUNT(*) AS n FROM tiendas GROUP BY 1, 2 ORDER BY 3 DESC;

SELECT 'venezolanas fuera de VE (tiene que dar 0)' AS que, COUNT(*) AS n
  FROM tiendas WHERE UPPER(TRIM(COALESCE(pais_origen,''))) = 'VE' AND mercado <> 'VE';

-- ── PARA VOLVER ATRÁS, si algo sale mal ───────────────────────────────────
-- Deshace las dos: todo lo venezolano vuelve al mercado US y el sitio queda
-- exactamente como el domingo. Se guarda aquí a propósito: una mudanza sin
-- marcha atrás escrita es una mudanza que nadie se atreve a hacer.
--
--   UPDATE tiendas SET mercado = 'US'
--    WHERE UPPER(TRIM(COALESCE(pais_origen,''))) = 'VE';
--   UPDATE pedidos SET mercado = 'US' WHERE mercado = 'VE';
