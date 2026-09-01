const DB_NAME = 'distance-app';
const DB_VERSION = 1;

function configureDatabase(event) {
  // TODO (Actividad 4): crear el almacén restaurants y su índice name cuando
  // event.oldVersion sea menor que 1.

  // TODO (Actividad 9): al actualizar DB_VERSION a 2, agregar una segunda
  // migración acumulativa que cree metroStations y su índice name.
}

function openDatabase() {
  // TODO (Actividad 5): envolver indexedDB.open(DB_NAME, DB_VERSION) en una
  // promesa y manejar upgradeneeded, success, error y blocked.
}

function readAll(database, storeName) {
  // TODO (Actividad 6): leer todos los registros mediante el índice name de
  // una transacción readonly.
}

function storeAll(database, storeName, records) {
  // TODO (Actividad 6): ejecutar un put por cada registro dentro de una única
  // transacción readwrite y resolver cuando la transacción emita complete.
}
