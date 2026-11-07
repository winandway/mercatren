"""DEVOLVER LOS PRODUCTOS DE LOS COMERCIOS DESDE UN RESPALDO (7 nov 2026).

Se usó para deshacer el vaciado del 3 nov, que se llevó por delante los
productos de los seis comercios de Venezuela. Lee dos bases SQLite locales
(el respaldo y una exportación fresca de la de hoy) y escribe un SQL que solo
INSERTA lo que falta y devuelve a su estado los productos que se quedaron.
No borra nada y se puede correr dos veces sin duplicar.

Uso (todo fuera del repositorio; los respaldos viven en ~/Respaldos):
  python3 -I scripts/restaurar-productos-de-comercios.py respaldo.db hoy.db salida.sql [fotos-perdidas.txt]
Deja al lado `salida.sql.claves`: las fotos que hay que volver a subir al cubo.
Ver HISTORIAL.md, «LOS PRODUCTOS DE LOS COMERCIOS VOLVIERON».
"""
import sqlite3, sys, os
r03, actual, salida = sys.argv[1], sys.argv[2], sys.argv[3]
# Fotos que ya no existen en ningún lado (ni en el respaldo ni en el cubo): no se
# devuelven, y el producto que se queda sin fotos vuelve en borrador.
PERDIDAS = set(l.strip() for l in open(sys.argv[4])) if len(sys.argv) > 4 else set()
SLUGS = ('bley-ferreteria','inversiones-multiservicios-ac0803','megayes','maxium',
         'variedades-colombia-next','brillox-steel','te-lo-vendo','snailock','usapam','mercatren-secciones')
db = sqlite3.connect(r03); db.execute("ATTACH ? AS n", (actual,))
q = lambda s, p=(): db.execute(s, p).fetchall()
tiendas = [r[0] for r in q(f"SELECT id FROM n.tiendas WHERE slug IN ({','.join('?'*len(SLUGS))})", SLUGS)]
ph = ','.join('?'*len(tiendas))
P = [r[0] for r in q(f"SELECT id FROM main.productos WHERE tienda_id IN ({ph})", tiendas)]
db.execute("CREATE TEMP TABLE P(id TEXT PRIMARY KEY)"); db.executemany("INSERT INTO P VALUES (?)", [(x,) for x in P])

def lit(v):
    if v is None: return "NULL"
    if isinstance(v, (int, float)): return repr(v)
    if isinstance(v, bytes): return "X'" + v.hex() + "'"
    return "'" + str(v).replace("'", "''") + "'"

def cols(t, esquema='main'):
    return [r[1] for r in q(f"PRAGMA {esquema}.table_info({t})")]

def pk(t):
    return [r[1] for r in sorted(q(f"PRAGMA main.table_info({t})"), key=lambda r: r[5]) if r[5] > 0]

lineas, resumen = [], {}
SIN_FOTO = set()
if PERDIDAS:
    for (pid,) in q("SELECT id FROM P"):
        todas = [r[0] for r in q("SELECT clave FROM main.imagenes_producto WHERE producto_id=?", (pid,))]
        if todas and all(x in PERDIDAS for x in todas): SIN_FOTO.add(pid)
print("productos que vuelven en borrador por fotos perdidas:", len(SIN_FOTO))
def insertar_faltantes(t, where):
    c_old, c_new = cols(t), set(cols(t, 'n'))
    c = [x for x in c_old if x in c_new]          # solo columnas que existen hoy
    k = pk(t)
    cond = " AND ".join(f"x.{a} = y.{a}" for a in k)
    filas = q(f"SELECT {','.join('y.'+x for x in c)} FROM main.{t} y WHERE {where} "
              f"AND NOT EXISTS (SELECT 1 FROM n.{t} x WHERE {cond})")
    if t == "imagenes_producto" and PERDIDAS:
        i = c.index("clave"); filas = [f for f in filas if f[i] not in PERDIDAS]
    if t == "productos" and SIN_FOTO:
        i, e = c.index("id"), c.index("estado")
        filas = [tuple("borrador" if (j == e and f[i] in SIN_FOTO) else v for j, v in enumerate(f)) for f in filas]
    for f in filas:
        lineas.append(f"INSERT OR IGNORE INTO {t} ({','.join(c)}) VALUES ({','.join(lit(v) for v in f)});")
    resumen[t] = len(filas)

# 1. categorías de esas tiendas y las que usan sus productos
insertar_faltantes("categorias", f"(y.tienda_id IN ({','.join(lit(x) for x in tiendas)}) "
                   "OR y.id IN (SELECT categoria_id FROM main.productos WHERE id IN (SELECT id FROM P)))")
# 2. productos que faltan
insertar_faltantes("productos", "y.id IN (SELECT id FROM P)")
# 3. los que quedaron (borrador, sin categoría): vuelven a como estaban
c = [x for x in cols("productos") if x in set(cols("productos", 'n')) and x != 'id']
quedaron = q(f"SELECT id,{','.join(c)} FROM main.productos WHERE id IN (SELECT id FROM P) "
             "AND id IN (SELECT id FROM n.productos)")
for f in quedaron:
    sets = ",".join(f"{a} = {lit(v)}" for a, v in zip(c, f[1:]))
    lineas.append(f"UPDATE productos SET {sets} WHERE id = {lit(f[0])};")
resumen["productos (devueltos a como estaban)"] = len(quedaron)
# 4. lo que cuelga de cada producto
for t in ["variantes_producto","imagenes_producto","medidas_producto","envios_producto",
          "fotos_de_producto","texto_de_busqueda","socios_alias","intentos_descripcion",
          "fotos_rotas","embeddings_producto","valoraciones","preguntas_producto"]:
    if t not in [r[0] for r in q("SELECT name FROM n.sqlite_master WHERE type='table'")]:
        resumen[t] = "no existe hoy"; continue
    insertar_faltantes(t, "y.producto_id IN (SELECT id FROM P)")

open(salida, "w").write("\n".join(lineas) + "\n")
claves = [r[0] for r in q("SELECT clave FROM main.imagenes_producto WHERE producto_id IN (SELECT id FROM P) AND clave IS NOT NULL "
         "AND clave NOT IN (SELECT clave FROM n.imagenes_producto WHERE clave IS NOT NULL)") if r[0] not in PERDIDAS]
open(salida + ".claves", "w").write("\n".join(claves) + "\n")
print("productos en juego:", len(P))
for k, v in resumen.items(): print(f"  {k}: {v}")
print("sentencias:", len(lineas), "| fotos:", len(claves))
