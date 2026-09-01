# Laboratorio 4: Persistencia con IndexedDB

Este laboratorio se enfoca en incorporar persistencia local a una aplicación que obtiene sus datos desde una API. La actividad comienza expandiendo la app desarrollada en los laboratorios anteriores con una implementación enfocada en el manejo de restaurantes y estaciones de Metro, obtenidas desde una api y almacenadas en memoria. Posteriormente se crea una base de datos IndexedDB en su versión 1 para persistir los restaurantes y se actualiza el esquema a una versión 2 para incorporar las estaciones.

La aplicación entregada corresponde a una continuación de la utilizada en los laboratorios anteriores donde las actividades solicitadas anteriormente ya se encuentran implementadas (El manifest, la interfaz, la geolocalización, el registro del service worker y la disponibilidad del app shell sin conexión se encuentran resueltos). Estos elementos no se deben modificar: el trabajo se concentra en el consumo de la API, la apertura de IndexedDB, las transacciones y la actualización de su esquema.

Las habilidades que se espera ejercitar en esta actividad son:

1. Distinguir entre información mantenida en memoria e información persistida por el navegador
2. Consumir una API pública desde un origen diferente y validar su respuesta
3. Abrir una base IndexedDB y manejar los eventos de la solicitud de apertura
4. Crear almacenes de objetos e índices durante `upgradeneeded`
5. Leer y escribir registros mediante transacciones
6. Actualizar una base existente sin eliminar sus datos anteriores
7. Distinguir la actualización de una base existente de la creación directa de su versión más reciente
8. Inspeccionar y eliminar bases de datos mediante DevTools

## Entorno de trabajo

Para desarrollar el laboratorio se requiere:

1. La versión estable más reciente de Google Chrome para escritorio
2. Un editor de código
3. Python 3, Node.js u otro servidor HTTP local
4. El portal de publicación y las credenciales entregadas por el equipo docente

Se puede trabajar en Windows, macOS o Linux. Las instrucciones y verificaciones utilizan los nombres de la interfaz en español de Chrome DevTools. No se requiere un teléfono ni instalar la aplicación.

## Preparación

El directorio [`app/`](app/) contiene el material base:

```text
app/
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── app.js
├── app.webmanifest
├── database.js
├── index.html
├── register-sw.js
├── styles.css
└── sw.js
```

Antes de modificar los archivos, se debe revisar su contenido:

- `index.html` y `styles.css` contienen la interfaz completa, incluidos los estados utilizados cuando un catálogo no se encuentra disponible
- `app.js` contiene el cálculo de distancia, la geolocalización y los bloques `TODO` que conectarán la API con la interfaz y con IndexedDB
- `database.js` contiene las constantes y funciones que implementarán la apertura, el esquema y las transacciones
- `sw.js` mantiene disponible el app shell sin conexión y deja pasar las solicitudes dirigidas a otros orígenes
- `register-sw.js`, `app.webmanifest` e `icons/` se encuentran completos

No se deben incorporar arreglos de restaurantes o estaciones dentro de la aplicación. Ambos catálogos deben provenir de la API compartida.

## API compartida

La infraestructura de la asignatura expone dos endpoints públicos:

| Información | Endpoint |
| --- | --- |
| Restaurantes | `https://pwa.shareddomain.link/api/restaurants` |
| Estaciones de Metro | `https://pwa.shareddomain.link/api/metro-stations` |

Cada endpoint responde con un arreglo JSON cuyos elementos poseen la siguiente estructura:

```json
{
  "id": "restaurant-1",
  "name": "Restaurant Valle Hermoso",
  "latitude": -33.42897,
  "longitude": -70.72752
}
```

Los endpoints no requieren autenticación y autorizan solicitudes desde cualquier origen.

Los datos entregados son fijos. Al incorporar persistencia, la API se utiliza para inicializar un almacén vacío; no se implementará actualización periódica, sincronización ni resolución de conflictos.

## Conceptos previos

### Datos en memoria

El resultado de `response.json()` queda disponible para el contexto JavaScript que procesó la respuesta. Utilizar ese arreglo para completar un selector no lo conserva después de cerrar o recargar la página. Una nueva ejecución debe repetir la solicitud o recuperar una copia almacenada por otro mecanismo.

### Solicitudes y transacciones de IndexedDB

La API nativa de IndexedDB utiliza solicitudes y eventos. Operaciones como `indexedDB.open(...)`, `objectStore.getAll()` y `objectStore.put(...)` devuelven un `IDBRequest`. El resultado se encuentra disponible cuando se produce `success`; un fallo se informa mediante `error`.

Las operaciones sobre almacenes se realizan dentro de una transacción. Una solicitud individual puede terminar correctamente antes que las demás. La escritura completa se considera confirmada cuando la transacción emite `complete`; si una solicitud falla sin que su error sea cancelado, la transacción se aborta.

### Actualización acumulativa del esquema

`upgradeneeded` se ejecuta cuando la base no existe o cuando se solicita una versión mayor. `event.oldVersion` identifica el esquema desde el cual comienza la actualización. Las migraciones deben ser acumulativas para que una base nueva pueda construir directamente la última versión:

```js
if (event.oldVersion < 1) {
  // Crear el esquema incorporado en la versión 1.
}

if (event.oldVersion < 2) {
  // Incorporar los cambios de la versión 2.
}
```

## Procedimiento

### 1. Ejecutar y restablecer la aplicación base

No se debe abrir `index.html` mediante una URL `file://`. Abrir un terminal dentro de `app/` e iniciar un servidor HTTP local. Por ejemplo:

```sh
python -m http.server 8000
```

Acceder a `http://localhost:8000` y abrir DevTools. En `Aplicación` → `Almacenamiento`, borrar los datos del sitio correspondientes a este origen. Recargar con la red habilitada y comprobar:

1. No existe una base IndexedDB asociada al origen
2. Los selectores no contienen restaurantes ni estaciones incorporados por la aplicación
3. La interfaz presenta un estado reconocible mientras los catálogos no se encuentran disponibles
4. La consola no presenta errores ajenos a los bloques `TODO`

El service worker entregado se utiliza únicamente para mantener disponible el app shell durante las comprobaciones sin conexión. No se debe modificar ni volver a implementar su ciclo de vida.

Antes de continuar, se debe esperar que el worker alcance el estado `activated` y recargar una vez con conexión. `navigator.serviceWorker.controller` debe entregar un valor distinto de `null`; de otro modo, la recarga posterior sin conexión no podrá utilizar el app shell.

### 2. Consumir la API sin persistencia

En `app.js`, localizar `fetchCollection(url)`. Implementar una solicitud que:

1. Utilice `fetch(url)` y espere la respuesta
2. Compruebe `response.ok`
3. Convierta el cuerpo mediante `response.json()`
4. Compruebe que el resultado sea un arreglo
5. Retorne el arreglo o lance un error descriptivo

Luego, completar `loadRestaurantCatalog(database)` y `loadMetroStationCatalog(database)` para que cada función retorne el resultado de `fetchCollection(...)` con el endpoint correspondiente. `initializeCatalogs()` utilizará esos resultados para completar los selectores. En esta etapa no se debe abrir IndexedDB y la variable `database` debe permanecer en `null`.

En `Red`, seleccionar cada solicitud y verificar:

- Método `GET`
- Estado HTTP `200`
- Tipo de contenido JSON
- Encabezado `Access-Control-Allow-Origin: *`
- Encabezado `Cache-Control: no-store`
- Ausencia de encabezados de autenticación

Recargar varias veces y comprobar que cada ejecución vuelve a solicitar ambos catálogos.

### 3. Comprobar que el consumo de la API no implica persistencia

Con la aplicación cargada, utilizar `Aplicación` → `Service Workers` para activar `Sin conexión` y recargar. El app shell debe continuar disponible, pero ninguno de los dos catálogos podrá recuperarse.

Comprobar que:

1. Ambos intentos de `fetch()` fallan
2. Los selectores presentan el estado sin datos
3. No aparece una base IndexedDB
4. La aplicación no intenta utilizar Cache Storage para las respuestas de la API

Desactivar `Sin conexión` antes de continuar.

### 4. Crear IndexedDB versión 1

Abrir `database.js`. La primera versión de la base debe contener solamente el almacén `restaurants`.

Definir:

```text
Nombre de la base: distance-app
Versión: 1
Almacén: restaurants
Clave: id
Índice: name
```

Completar `configureDatabase(event)` para que el bloque `event.oldVersion < 1`:

1. Obtenga la conexión desde `event.target.result`
2. Cree `restaurants` mediante `createObjectStore(...)`
3. Utilice `id` como `keyPath`
4. Cree un índice no único denominado `name`

No se debe solicitar la API dentro de `upgradeneeded`. Esta función modifica el esquema; la carga de registros se realizará después de que la apertura termine correctamente.

### 5. Abrir la base

Completar `openDatabase()` construyendo una promesa alrededor de `indexedDB.open(DB_NAME, DB_VERSION)`.

La solicitud debe manejar:

- `upgradeneeded`: invocar `configureDatabase(event)`
- `success`: resolver con `event.target.result`
- `error`: rechazar utilizando `event.target.error`
- `blocked`: informar que otra conexión impide actualizar la base, sin resolver ni rechazar la promesa

La conexión obtenida en `success` debe cerrar cuando reciba `versionchange`. Esto permite que una versión posterior pueda actualizar el esquema sin permanecer bloqueada por una pestaña antigua.

Cuando se produce `blocked`, la solicitud de apertura permanece pendiente. Si se cierra la conexión antigua, el navegador puede continuar con `upgradeneeded` y terminar posteriormente en `success`; por este motivo, el listener se utiliza para informar el problema y no para rechazar la operación.

Después de completar la función, modificar `initializeCatalogs()` para asignar a `database` el resultado de `await openDatabase()`. Las funciones que cargan los catálogos todavía reciben esa conexión sin utilizarla; su incorporación permite crear e inspeccionar la base antes de persistir registros.

Recargar y comprobar en `Aplicación` → `IndexedDB` que exista `distance-app`, versión 1, con un almacén `restaurants` todavía vacío.

### 6. Implementar las transacciones de lectura y escritura

En `database.js`, completar `readAll(database, storeName)`:

1. Crear una transacción `readonly`
2. Abrir el almacén indicado
3. Abrir su índice `name`
4. Ejecutar `getAll()` sobre el índice
5. Resolver con `request.result` durante `success`
6. Rechazar durante `error`

Luego completar `storeAll(database, storeName, records)`:

1. Crear una transacción `readwrite`
2. Abrir el almacén indicado
3. Ejecutar `put(record)` para cada elemento
4. Resolver solamente durante `transaction.complete`
5. Rechazar durante `transaction.abort`

No se debe considerar terminada la escritura después del primer `request.success`; todos los registros forman parte de la misma transacción.

### 7. Persistir los restaurantes

En `app.js`, completar `loadPersistedCollection(database, storeName, endpoint)` con el siguiente flujo:

1. Consultar `readAll(...)`
2. Si existen registros, retornarlos sin solicitar la API
3. Si el almacén está vacío, obtener el catálogo mediante `fetchCollection(...)`
4. Guardar todos los registros mediante `storeAll(...)`
5. Leer nuevamente el almacén y retornar su contenido

Modificar `loadRestaurantCatalog(database)` para:

- Obtener los restaurantes mediante `loadPersistedCollection(...)`
- Retornar el arreglo resultante a `initializeCatalogs()`

`loadMetroStationCatalog(database)` debe continuar obteniendo las estaciones directamente desde la API.

Cada catálogo debe manejar su propio error. Si la solicitud de estaciones falla, los restaurantes recuperados correctamente desde IndexedDB deben mostrarse de todas formas.

Recargar con conexión y comprobar que `restaurants` contiene registros ordenados por el índice `name`.

### 8. Verificar la versión 1 sin conexión

Activar `Sin conexión` y recargar. El resultado esperado es:

- El app shell continúa disponible
- Los restaurantes se recuperan desde IndexedDB
- Las estaciones no se encuentran disponibles porque su solicitud falla
- El selector de estaciones permanece deshabilitado
- La base continúa en versión 1 y sólo contiene `restaurants`

Esta diferencia debe observarse antes de implementar la versión 2. No se deben borrar los datos del sitio entre ambas versiones.

Desactivar `Sin conexión` antes de continuar.

### 9. Actualizar el esquema a la versión 2

En `database.js`, cambiar `DB_VERSION` a `2`. Agregar un segundo bloque independiente dentro de `configureDatabase(event)`:

```text
Condición: event.oldVersion < 2
Almacén: metroStations
Clave: id
Índice: name
```

Cerrar cualquier otra pestaña que utilice el mismo origen y recargar. En `Aplicación` → `IndexedDB`, comprobar:

1. La base informa la versión 2
2. `restaurants` conserva los registros incorporados en la versión 1
3. Existe el nuevo almacén `metroStations`
4. El nuevo almacén se encuentra inicialmente vacío

Si la apertura queda bloqueada, se debe revisar qué pestaña conserva una conexión con la versión anterior. No se deben borrar los datos para ocultar el problema, porque se perdería la actualización que se busca observar.

### 10. Persistir las estaciones de Metro

Modificar `loadMetroStationCatalog(database)` para obtener las estaciones mediante `loadPersistedCollection(...)`, utilizando `metroStations` y su endpoint correspondiente.

Recargar con conexión y comprobar:

- No se vuelve a solicitar el catálogo de restaurantes, porque su almacén ya contiene registros
- Se solicita el catálogo de estaciones, porque el almacén nuevo se encuentra vacío
- `metroStations` recibe los registros mediante una transacción
- Ambos selectores se completan leyendo IndexedDB

### 11. Verificar la versión 2 sin conexión

Activar `Sin conexión` y recargar. Comprobar que:

1. Restaurantes y estaciones se recuperan desde IndexedDB
2. No se necesita una respuesta de la API para completar los selectores
3. Se puede calcular una distancia utilizando una estación
4. La base mantiene ambos almacenes y sus índices

Desactivar `Sin conexión` antes de continuar.

### 12. Crear una base nueva directamente en versión 2

En `Aplicación` → `IndexedDB`, eliminar solamente `distance-app`. No se deben borrar todos los datos del sitio, porque se necesita conservar el app shell para las comprobaciones posteriores.

Antes de recargar, establecer un breakpoint dentro de `configureDatabase(event)` o agregar temporalmente una instrucción que muestre `event.oldVersion` en la consola. Este apoyo se debe retirar después de completar la observación.

Recargar con conexión y comprobar:

1. `event.oldVersion` comienza en `0`
2. Los bloques `< 1` y `< 2` crean ambos almacenes
3. Como ambos almacenes están vacíos, se realizan las dos solicitudes a la API
4. Los registros se almacenan y la aplicación vuelve a funcionar

Esta comprobación demuestra por qué las migraciones se expresan como condiciones independientes y acumulativas.

### 13. Publicar y verificar el resultado final

Crear un ZIP con el contenido de `app/`, sin incluir la carpeta contenedora ni el propio ZIP. La estructura debe ser:

```text
index.html
app.js
app.webmanifest
database.js
register-sw.js
styles.css
sw.js
icons/
```

Publicar mediante el portal y abrir la URL HTTPS asignada. Si ese origen se utilizó en un laboratorio anterior, abrir DevTools, borrar sus datos desde `Aplicación` → `Almacenamiento` y cancelar cualquier registro anterior desde `Aplicación` → `Service Workers`. Luego, cerrar las demás pestañas que utilicen la misma URL y recargar con conexión.

En ese origen se utiliza una base IndexedDB diferente de la creada en `localhost`, por lo que esta carga debe crear directamente la versión 2 y solicitar ambos catálogos.

Después de completar la primera carga con conexión:

1. Inspeccionar ambos almacenes en DevTools
2. Activar `Sin conexión`
3. Recargar la URL publicada
4. Comprobar que la aplicación y ambos catálogos continúan disponibles
5. Desactivar `Sin conexión` al finalizar

## Problemas frecuentes

### La respuesta de la API es opaca

Comprobar que no se haya utilizado `mode: 'no-cors'`. Los endpoints ya entregan el encabezado CORS requerido y deben solicitarse en el modo normal de `fetch()`.

### La base no cambia a la versión 2

Cerrar otras pestañas del mismo origen. Una conexión abierta con la versión 1 puede producir el evento `blocked` e impedir que comience `upgradeneeded`.

### Aparece `NotFoundError` al abrir un almacén

Comprobar el valor de `DB_VERSION`, el nombre exacto del almacén y los bloques ejecutados por `configureDatabase`. `metroStations` no existe en la versión 1.

### Los datos no están disponibles sin conexión

Cada almacén debe cargarse al menos una vez con conexión. Revisar su contenido en DevTools antes de activar `Sin conexión`.

### Los cambios del código no aparecen

Recargar con la red habilitada y revisar la solicitud del archivo modificado en `Red`. El service worker entregado consulta primero la red y actualiza su copia local; no se deben crear cachés adicionales ni modificar `sw.js`.

### La aplicación no abre sin conexión

Comprobar que no se hayan borrado todos los datos del sitio después de la primera carga. Eliminar una base desde el panel de IndexedDB no elimina el app shell; utilizar `Borrar datos del sitio` sí elimina ambos mecanismos.
