# Iter: programar desde la intención

> Esta es una vista previa técnica. Iter todavía no está publicado en PyPI y no existe un paquete oficial instalable.

Abrir un recurso, convertir datos o cambiar de backend suele exigir aprender una interfaz diferente y repetir integración.

Iter nace de una idea sencilla:

## Aprende una vez. Usa cualquier biblioteca.

```iter
data = iter open "data.json"
csv = iter convert data to "csv"
iter export csv as "data.csv"
```

La intención permanece clara: abrir, convertir y exportar. Iter debe identificar el recurso, resolver el formato, consultar los adaptadores compatibles y coordinar la ejecución.

## Everything is a Resource

El modelo central representa archivos, datos y recursos web como `Resource`. Sus componentes principales son:

- `Resolver`, para identificar formatos, tipos y backends;
- `Registry`, para registrar y seleccionar adaptadores;
- `Adapter`, para ejecutar operaciones;
- `Engine`, para coordinar el flujo.

La meta no es fingir que todas las bibliotecas son idénticas. Es unificar intenciones comunes sin ocultar las diferencias importantes.

## Estado

Iter `0.3.0-rc.2` está en corrección de errores y validación privada. La forma final de la sintaxis puede ajustarse antes del lanzamiento. Solo se presentarán como disponibles las instrucciones implementadas y verificadas.

Vista previa: https://github.com/Martinmanhue/iter-public

**Iter — Everything is a Resource.**
