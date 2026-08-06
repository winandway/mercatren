# Plan: blindaje de pruebas y seguridad

Auditoría de los 20 puntos de la regla global. **6 de 20 en verde (30%)**.
Se instala solo lo que falta, ENCIMA de lo que hay. Nada de tocar la lógica
del producto: lo viejo que no pase se anota como deuda, no se "arregla".

- [ ] 1. tsconfig: `noUncheckedIndexedAccess` y `noImplicitOverride`.
      Si rompen el typecheck, se quitan y van a deuda.
- [ ] 2. eslint-plugin-security, en modo AVISO para no romper lo existente.
- [ ] 3. eslint-config-prettier, para que el formato no genere ruido.
- [ ] 4. MSW, para que ninguna prueba le pegue a un servicio real.
- [ ] 5. Prueba de humo: las rutas principales responden 200.
- [ ] 6. Umbral de cobertura fijado DONDE ESTÁ HOY (88% stmts), que rompe el
      build si baja.
- [ ] 7. `npm audit --audit-level=high` en el flujo de verificación.
- [ ] 8. gitleaks en pre-commit y en CI.
- [ ] 9. `.github/dependabot.yml`, npm y Actions, semanal.
- [ ] 10. `src/env.ts`: las variables se validan al arrancar, no en producción
      a las 2am.
- [ ] 11. Cabeceras de seguridad. CSP incluida, pero con cuidado de no tumbar
      el sitio.
- [ ] 12. Hook pre-push que corre `npm run verify`.
- [ ] 13. `npm run verify` como comando único.
- [ ] 14. CI: agregar audit y gitleaks a lo que ya corre.
- [ ] 15. Correr `verify` entero y comprobar las rutas en el navegador.
- [ ] 16. Commits, fusionar a main, informe. SIN desplegar.
