# Gestión de Armentia FC

## Datos y publicaciones

La fuente publicada es `data/site.json`. Cada partido guarda sus goles, asistencias, MVP y enlace a la publicación. `playerStats` conserva el resumen de temporada; al editar un partido se deben recalcular los totales y ejecutar `npm test`.

No asignar dorsales por suposición. Sarri es el nombre público de Martxel. Los datos por nombre de Ekhi, Aner y Erlantz se conservan hasta confirmar sus dorsales. Las fotos deben estar etiquetadas por el club; no identificar personas comparando caras.

## Correcciones de resultados

Cuando el club confirma un resultado erróneo en FAF, guardar `scoreOverride` con `goalsFor`, `goalsAgainst`, `source` y `confirmedAt`. La sincronización conserva la corrección, copia el marcador FAF a `officialScore` y activa `scoreDisputed` cuando no coincide. El aviso desaparece cuando la FAF coincide. Para aceptar una rectificación oficial diferente, retirar expresamente el override tras confirmación del club.

La clasificación se muestra tal como la publica la FAF; no se modifica artificialmente para ajustarla al marcador del club. Se avisa de la discrepancia.

## Calendario y vídeos

Los archivos ICS incluyen solo encuentros con fecha, hora y zona horaria confirmadas. No se inventa hora de fin. La descarga es una copia, no una suscripción: si cambia el horario hay que volver a añadir el partido.

El botón de vídeos abre el canal del club. No indica que exista un directo activo. Solo incorporar enlaces a retransmisiones concretas cuando estén verificados.

## Diseño y aprobación

Previa 9:16. Carrusel de resultado 4:5, 1080×1350: portada con foto real rotativa, estadísticas completas y MVP. Euskara como idioma principal. Negro y naranja. No retocar caras. Logos reales de Garoka, Dalvez y Abaienea con tamaño visual equilibrado y sin cajas desiguales.

Las bases de Canva convertidas desde PNG requieren revisión: la conversión puede modificar texto y elementos. Sustituir los datos históricos antes de exportar. El resultado 0–10 histórico no es correcto: fue 0–9, Sarri 1 gol y 1 asistencia.

Preparar → revisión y OK de Eneko → publicación → comprobar enlace. No duplicar un envío que esté procesándose.

## Seguimiento

Consultar alcance, visualizaciones, interacciones y compartidos en Metricool. Sumar alcance de publicaciones no equivale a personas únicas. Guardar fecha de consulta y enlaces. El informe para patrocinadores debe describir exposición observada, sin inventar ventas ni atribución.
