/**
 * Los mensajes de commit van en espanol y con el tipo adelante:
 *   feat: agrega el carrito
 *   fix: corrige el calculo de la comision
 */
const configuracion = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "header-max-length": [2, "always", 100],
  },
};

export default configuracion;
