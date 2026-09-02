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
  // promesa y manejar upgradeneeded, success, error y blocked, resolviendo
  // o rechazando según el caso.
}

function readAll(database, storeName) {
  // TODO (Actividad 6): envolver la transacción de readonly sobre el índice name
  // para leer todos los registros y resolver con el resultado o rechazar con
  // el error
}

function storeAll(database, storeName, records) {
  // TODO (Actividad 6): envolver la transacción readwrite que contiene un put
  // por cada registro y resolver cuando la transacción emita complete o
  // rechazar con el error generado.
}
