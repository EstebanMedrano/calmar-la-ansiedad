# El informe del Diario de Lu

La app manda cada cosa que pasa a un Google Sheets a través de un Apps Script.
El código del lado de la app está en [`src/utils/logger.ts`](../src/utils/logger.ts).

## Qué se envía ahora

Cada evento lleva **contexto común**, que antes no existía:

| Campo | Qué es | Para qué sirve |
|---|---|---|
| `sessionId` | Id único de la visita | Agrupar en la hoja todas las filas de una misma sesión |
| `timestamp` | Fecha y hora ISO | Ordenar y hacer gráficas sin pelearse con el formato local |
| `sessionMinutes` | Minutos desde que abrió | Ver en qué momento de la visita pasó cada cosa |
| `device` | móvil / tablet / escritorio | Saber desde dónde usa la app |
| `os`, `browser` | Android/iOS/Windows…, Chrome/Safari… | Reproducir un problema si algo falla |
| `installed` | `app` o `navegador` | Ver si de verdad la instaló en el móvil |
| `screen`, `lang` | Resolución e idioma | Diagnóstico |

Y estos **tipos de evento**:

| `type` | Cuándo | Campos propios |
|---|---|---|
| `session` | Elige nivel de ansiedad, o llega a 0 | `initialLevel`, `finalLevel`, `duration`, `outcome` |
| `game` | Abre y cierra cada juego | `gameName`, `event` (inicio/completado/abandonado), `duration`, `durationSeconds` |
| `text` | Escribe en Ritual de Soltar | `gameName`, `text`, `words`, `chars` |
| `grounding` | Completa un paso del 5-4-3-2-1 | `step`, `responses` |
| `visit` | Cierra la app | `finalLevel`, `duration`, `durationSeconds` |
| `suggestion` | Envía algo por el buzón de ideas | `category`, `text`, `words`, `chars` |

Los eventos `game`, `visit` y `suggestion` son nuevos. Los dos primeros dicen
**qué usó y cuánto rato**, que es lo que antes no se veía en ninguna parte. El
tercero es el buzón de ideas del pie de página: lo que escriba ahí llega a la
hoja como una fila más, con su categoría (idea nueva, sobre un juego, algo no
funciona, cómo me sentí) en la columna `category` y el mensaje en `text`.

## Cómo se comporta el envío

- **Sin conexión no se pierde nada.** El evento se guarda en el navegador y se
  reenvía cuando vuelve la red (o en la siguiente visita).
- **El cierre de la app sí llega.** El evento `visit` va por `sendBeacon`, que el
  navegador entrega por su cuenta aunque la pestaña ya esté cerrada. Con `fetch`
  normal esa petición se cancelaba siempre.

## Actualizar el Apps Script

El script actual sigue funcionando: los nombres de campo de antes no han
cambiado, solo se han añadido otros. Para que las columnas nuevas aparezcan en
la hoja, sustituye el contenido del script por esto:

```javascript
// Extensiones > Apps Script, en la hoja del Diario de Lu.
// Después: Implementar > Nueva implementación > Aplicación web
//   · Ejecutar como: Yo
//   · Quién tiene acceso: Cualquier usuario
// La URL /exec resultante es la que va en src/utils/logger.ts.

// El orden de esta lista es el orden de las columnas.
var COLUMNAS = [
  'timestamp', 'date', 'time', 'type', 'sessionId', 'sessionMinutes',
  'gameName', 'event', 'duration', 'durationSeconds',
  'initialLevel', 'finalLevel', 'outcome',
  'step', 'responses', 'category', 'text', 'words', 'chars',
  'device', 'os', 'browser', 'installed', 'screen', 'lang'
];

function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Diario')
            || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Diario');

    // Cabecera la primera vez.
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(COLUMNAS);
      hoja.setFrozenRows(1);
      hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold');
    }

    var fila = COLUMNAS.map(function (c) {
      return datos[c] === undefined || datos[c] === null ? '' : datos[c];
    });
    hoja.appendRow(fila);

    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}
```

> Importante: al reimplementar, usa **Implementación > Editar > Nueva versión**
> sobre la implementación existente. Si creas una implementación distinta la URL
> cambia y habría que actualizarla también en `src/utils/logger.ts`.

Si prefieres empezar con una hoja limpia, borra la pestaña `Diario` y el script
la vuelve a crear con la cabecera nueva en el primer envío.
