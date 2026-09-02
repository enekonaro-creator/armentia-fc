# Guía rápida de actualización

## Plantilla

En `data/site.json`, cada jugador tiene este formato:

```json
{ "number": 16, "name": "Navarro" }
```

Los dorsales no se pueden repetir. Cuando la plantilla sea definitiva, cambia:

```json
"rosterStatus": "confirmed"
```

## Clasificación

Cuando la FAF publique la temporada, pega los enlaces en `data/faf-config.json`:

```json
{
  "teamUrl": "https://www.faf-aff.eus/...ficha-del-equipo...",
  "standingsUrl": "https://www.faf-aff.eus/...clasificacion..."
}
```

Después ejecuta una vez **Actions → Sincronizar Federación → Run workflow**. A partir de ahí se comprobará automáticamente cada día. Si se dejan vacíos, la web muestra el estado de espera y no inventa partidos ni clasificación.

## Partidos desde GitHub Actions

La fecha debe incluir hora y zona horaria. Ejemplo:

```text
2026-09-12T18:00:00+02:00
```

- `home`: Armentia juega como local.
- `away`: Armentia juega como visitante.
- En modo `result`, `goals_for` siempre son los goles de Armentia, juegue donde juegue.

## Patrocinadores y fotos

Sube primero la imagen a `assets/images`. Después añade su ruta en `data/site.json`. La validación automática impide publicar rutas a imágenes que no existen.

## Euskera y castellano

Los textos con traducción siempre deben incluir ambas claves:

```json
{
  "eu": "Testua euskaraz",
  "es": "Texto en castellano"
}
```

## Goles y asistencias

1. Abre **Actions → Actualizar estadísticas**.
2. Usa `add` para sumar lo ocurrido en el último partido.
3. Introduce el dorsal, los goles y las asistencias.
4. Repite solo con los jugadores que hayan marcado o asistido.

Para corregir un acumulado, usa `set`: los números introducidos sustituirán el total anterior de ese jugador.
