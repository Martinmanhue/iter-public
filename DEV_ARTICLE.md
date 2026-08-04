# Iter: programar desde la intención

> **Vista previa técnica:** Iter todavía no está publicado en PyPI y no existe un paquete oficial instalable.

Abrir un recurso, convertir datos o cambiar de backend suele exigir aprender una interfaz diferente y repetir código de integración.

Iter nace de una idea sencilla:

## Aprende una vez. Usa cualquier biblioteca.

```iter
iter convert data.json to data.csv
```

El usuario expresa una sola intención. Iter debe encargarse de abrir el recurso, detectar los formatos, seleccionar un adaptador compatible, convertir los datos y guardar el resultado.

**Una intención. Una instrucción.**

## ¿Qué busca cambiar Iter?

Actualmente, una tarea sencilla puede exigir:

- importar bibliotecas;
- aprender APIs diferentes;
- configurar formatos manualmente;
- escribir código de integración;
- seleccionar cada backend.

Con Iter, el usuario indica principalmente qué quiere conseguir:

```iter
iter analyze sales.csv
```

Cuando necesita control explícito, puede pedirlo:

```iter
iter analyze sales.csv with pandas
```

La intención principal no cambia.

## Everything is a Resource

Iter representa archivos, datos y recursos web mediante una estructura común llamada `Resource`.

El usuario no necesita escribir los detalles internos en cada operación. El sistema coordina cinco partes principales:

- **Resource:** representa el recurso;
- **Resolver:** identifica formatos, tipos y backends;
- **Registry:** registra y selecciona adaptadores;
- **Adapter:** ejecuta una operación concreta;
- **Engine:** coordina el flujo.

```text
Usuario
  │
  ▼
Lenguaje y API de Iter
  │
  ▼
Resolver ──► Registry ──► Adapter
  │                         │
  └────────── Engine ◄──────┘
              │
              ▼
           Resource
```

## Crear un recurso

```iter
iter create project.json {
    project: "Iter"
    status: "preview"
}
```

La extensión permite deducir el formato. Iter debe crear y guardar el recurso de manera coordinada.

## Qué no afirma esta vista previa

Iter todavía no afirma:

- que todas las bibliotecas estén integradas;
- que la sintaxis sea definitiva;
- que sustituya Python;
- que ya sea un estándar;
- que exista una distribución oficial instalable.

La versión candidata actual es `0.3.0-rc.2` y continúa en corrección de errores y validación privada.

## Qué se publica ahora

El repositorio público contiene:

- la idea del proyecto;
- la sintaxis prevista;
- la arquitectura general;
- la hoja de ruta pública;
- un espacio para comentarios técnicos.

El código principal, Iter Server e Iter Storage permanecen privados.

## Participa

La vista previa pública está disponible en:

**https://github.com/Martinmanhue/iter-public**

Puedes marcar una estrella para seguir el lanzamiento y responder al issue:

**¿Qué debería unificar Iter primero?**

https://github.com/Martinmanhue/iter-public/issues/1

---

**Iter — Everything is a Resource.**

Etiquetas sugeridas para DEV: `programming`, `devtools`, `softwarearchitecture`, `python`
