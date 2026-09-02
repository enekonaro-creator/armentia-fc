# Armentia FC — web 2026/27

Web estática oficial de Armentia FC, publicada en [armentiafc.com](https://armentiafc.com) mediante GitHub Pages.

## Actualizaciones habituales

El contenido de temporada está centralizado en `data/site.json`. Desde ese archivo se cambian:

- temporada, plantilla y estado provisional/definitivo;
- próximo partido y último resultado;
- calendario, resultados, clasificación y estadísticas;
- patrocinadores, galería y textos bilingües.

No hace falta editar `index.html` para estos cambios.

### Actualizar un partido sin editar código

1. Abre **Actions** en GitHub.
2. Entra en **Actualizar partido**.
3. Pulsa **Run workflow**.
4. Selecciona:
   - `next`: publicar el próximo partido;
   - `result`: publicar el último resultado;
   - `clear-next`: borrar el próximo partido.
5. Completa los campos y ejecuta el flujo.

La automatización valida los datos, crea el commit y GitHub Pages publica el cambio.

### Sincronización con la Federación Alavesa

El flujo **Sincronizar Federación** se ejecuta una vez al día. Lee la ficha del equipo y la clasificación, valida la respuesta y solo publica si encuentra cambios. Mientras la FAF no haya publicado la temporada 2026/27, los enlaces de `data/faf-config.json` permanecen vacíos y el flujo termina sin modificar la web.

Cuando se publiquen los datos solo hay que introducir:

- el enlace de la ficha de Armentia FC;
- el enlace de la clasificación de su grupo.

El equipo se identifica mediante los alias `ARMENTIA FC` y `GAROKA`, pero en la web siempre se muestra **Armentia FC**.

### Estadísticas de jugadores

Desde **Actions → Actualizar estadísticas** se pueden sumar goles y asistencias indicando únicamente dorsal y cantidades. La opción `set` permite corregir el total de un jugador.

## Trabajo local

No hay dependencias de producción ni proceso de compilación. Para servir la web:

```bash
python3 -m http.server 8080
```

Para validar el código y los datos:

```bash
npm test
```

## Antes de publicar la temporada 2026/27

- Confirmar la plantilla y cambiar `rosterStatus` a `confirmed`.
- Añadir los dos enlaces oficiales en `data/faf-config.json`.
- Probar manualmente el flujo **Sincronizar Federación**.
- Sustituir o ampliar las fotos cuando estén disponibles las de la nueva temporada.

Consulta [docs/ACTUALIZAR_WEB.md](docs/ACTUALIZAR_WEB.md) para ejemplos exactos.
