# Meteorología y recomendaciones V1

## Estado de lanzamiento

«Más favorables hoy» está activa y utiliza **únicamente Open-Meteo** para el
pronóstico. Se retiraron el bloqueo y las comprobaciones geográficas de advertencias
de INUMET. INUMET se enlaza para consulta del visitante; no se consultan ni se
verifican sus advertencias automáticamente.

## Consultas y comprobación meteorológica

Documentación: https://open-meteo.com/en/docs

Se solicitan condiciones actuales y códigos horarios de hoy, con
`timezone=America/Montevideo`, km/h y timestamps Unix. Se evalúan las horas restantes
del día uruguayo, incluida la hora en curso, sin depender del huso del navegador.

Los únicos códigos horarios que excluyen por condiciones meteorológicas son
**95, 96, 97 y 99**. Lluvia intensa (65), chubascos fuertes (82), viento fuerte y
ráfagas elevadas no excluyen. El código actual no reemplaza la comprobación horaria.

Se comprueban todas las ubicaciones de cada pesquero. Si cualquiera tiene tormentas
previstas, coordenadas inválidas, horas faltantes/códigos desconocidos, viento actual
incompleto/desactualizado o una consulta fallida, no se recomienda ese pesquero.
Un fallo local no elimina candidatos de otras zonas con información completa.

Las consultas al mismo punto se comparten tanto en el cálculo como en el servicio;
se conservó la caché de cinco minutos, invalidada al cambiar el día uruguayo. Los
errores no se guardan. Máximo cuatro solicitudes simultáneas; el timeout de doce
segundos comienza cuando la solicitud sale de la cola. Sin nuevas dependencias.

El selector de la home mantiene sus cuatro referencias costeras, sus estados de
carga/error y la fase lunar independiente. No se modificó su código.

## Puntuación y presentación

Se conserva la interpretación de estaciones meteorológicas del hemisferio sur,
con fecha uruguaya, arreglos, estación única y «Todo el año».

- **50 % especies:** tres cupos con las especies en temporada de mayor frecuencia
  (`nivel/5`), sumados y divididos entre tres. Los cupos vacíos valen cero.
  Se excluyen avisos `conservacion`, `prohibicion` y `veda`. Sin especies elegibles,
  el pesquero no es candidato.
- **30 % viento:** mejor coincidencia de dirección con `mejorViento` (string o
  arreglo), ponderada por intensidad y ráfagas. Coincidencia exacta vale 1 y cae
  a cero a 90°. La intensidad tiene factor máximo entre 5 y 20 km/h, cae a cero
  a 40 km/h y se reduce por calma entre 0 y 5 km/h. Las ráfagas tienen factor máximo
  hasta 30 km/h y caen a cero a 50 km/h. Un factor cero solo resta puntos:
  **no impide recomendar** si los demás componentes lo permiten.
- **20 % nivel:** nivel general del pesquero normalizado con `nivel/5`.

Para varios puntos se toma el menor puntaje. Se ordenan los candidatos, se aplican
los filtros y la búsqueda y se muestran como máximo tres. Si quedan uno o dos,
se muestran esos; sin candidatos se oculta toda la sección. No se modifica el
arreglo ni el orden de «Todos los pesqueros».

El listado completo carga sin esperar a Open-Meteo y conserva sus nodos al terminar
la consulta de recomendaciones. Se revalidan cada cinco minutos, al cambiar de hora
(incluida medianoche), al volver a la pestaña o al restaurar la página. Se ocultan
resultados viejos durante una nueva comprobación. Las respuestas de una evaluación
anterior no pueden reemplazar la evaluación nueva.

El aviso visible enlaza https://www.inumet.gub.uy/alerta y dice:

> Recomendaciones orientativas según especies, viento y pronóstico. Consultá las
> advertencias de INUMET y las condiciones del mar antes de salir.

La clasificación no representa una probabilidad de captura ni garantiza seguridad.

## Datos conservados y limitaciones

Los JSON permanecen intactos. Hay coordenadas fuera de Uruguay, por ejemplo
`-24.031446` en «El Cabito», Punta del Diablo, y `-34909235` en Puerto del Buceo.
Se omiten los pesqueros afectados; no se adivinan coordenadas.

La veda de corvina negra tiene fechas y ámbitos en texto, sin campos estructurados.
Se conserva su exclusión del puntaje, sin afirmar que su captura esté prohibida en
toda la costa. El selector no describe un departamento entero; las recomendaciones
utilizan las coordenadas de los pesqueros.

## Pruebas

Ejecutar `node --test tests/recomendaciones.test.cjs` (sin instalar paquetes).
Incluye lluvia intensa, chubascos, viento fuerte, ráfagas, cada código de tormenta,
todos excluidos, errores, datos insuficientes, temporadas, conservación, puntajes,
orden, filtros antes del límite, deduplicación, caché y concurrencia.

Verificado en Chrome sin interfaz con respuestas Open-Meteo simuladas y navegador
en Asia/Tokyo: sección activa con lluvia intensa, viento de 80 km/h y ráfagas de
120 km/h; máximo de tres; filtros, búsqueda y paginación; orden y nodos del listado
general conservados; sin consultas duplicadas; sin desbordamiento a 320, 390 y
1280 px. Cada código de tormenta, los errores HTTP y las horas faltantes ocultan
toda la sección sin impedir usar el listado. No hubo excepciones JavaScript.
