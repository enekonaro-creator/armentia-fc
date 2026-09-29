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

La liga 2026/27 está conectada al grupo A de Tercera División F7 (grupo `25027571`, equipo `22788077`, temporada `22`). Los enlaces se guardan en `data/faf-config.json`:

```json
{
  "teamUrl": "https://www.faf-aff.eus/...ficha-del-equipo...",
  "standingsUrl": "https://www.faf-aff.eus/...clasificacion..."
}
```

Los cambios de configuración ejecutan automáticamente la sincronización. También puedes usar **Actions → Sincronizar Federación → Run workflow**. Se comprueba cada día y se publica en GitHub Pages cuando hay cambios. Si falla la lectura, conserva los últimos datos válidos.

Las fechas sin horario se guardan como `AAAA-MM-DD` y aparecen con «Hora por confirmar». El campo se obtiene de la jornada oficial cuando está publicado.

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
