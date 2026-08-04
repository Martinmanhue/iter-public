# Hoja de ruta pública de Iter

Esta hoja de ruta describe únicamente objetivos públicos. No revela el código interno, la infraestructura privada ni información de seguridad sensible.

## Estado actual

- Versión candidata: `0.3.0-rc.2`
- Fase: corrección de errores y validación privada
- Distribución oficial: todavía no publicada
- Repositorio principal: privado
- Repositorio público: documentación, demostración y participación

## Antes del lanzamiento

- [ ] Corregir los errores de la Release Candidate.
- [ ] Ejecutar la suite completa de pruebas.
- [ ] Verificar que los ejemplos públicos coincidan con el comportamiento real.
- [ ] Auditar secretos, tokens, rutas locales y datos personales.
- [ ] Revisar la licencia y las condiciones de distribución.
- [ ] Comprobar la instalación en un entorno limpio.
- [ ] Preparar las notas de lanzamiento.
- [ ] Publicar instrucciones oficiales de instalación.

## Primera publicación

La primera versión pública debe priorizar:

- apertura y creación de recursos;
- guardado y cierre coordinados;
- resolución de formatos;
- conversión y exportación;
- selección de adaptadores;
- diagnósticos comprensibles;
- documentación reproducible.

## Después del lanzamiento

- ampliar los adaptadores según casos de uso reales;
- mejorar mensajes de error y diagnóstico;
- medir compatibilidad y fiabilidad;
- publicar demostraciones verificables;
- recoger propuestas mediante issues;
- documentar límites y diferencias entre backends.

## Iter Server e Iter Storage

Iter Server e Iter Storage no forman parte de este repositorio público. Su código, administración, infraestructura y documentación interna permanecen privados.

Cualquier anuncio sobre estos productos se realizará únicamente cuando exista una versión preparada y autorizada.

## Regla de progreso

Una función solo debe marcarse como terminada cuando esté implementada, probada y documentada. Las ideas, borradores y prototipos no cuentan como funciones finalizadas.

---

[Volver a la portada](README.md) · [Proponer una prioridad](https://github.com/Martinmanhue/iter-public/issues/1)
