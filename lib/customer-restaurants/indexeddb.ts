import {
  CUSTOMER_RESTAURANT_DB_VERSION,
  sortSavedRestaurants,
  type SavedRestaurant,
  type SavedRestaurantRepository,
} from "@/lib/customer-restaurants/types";

const DEFAULT_DATABASE_NAME = "zantap-customer";
const SAVED_RESTAURANTS_STORE = "savedRestaurants";

interface IndexedDbRepositoryOptions {
  indexedDB: IDBFactory;
  databaseName?: string;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

function openCustomerDatabase(
  indexedDB: IDBFactory,
  databaseName: string
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, CUSTOMER_RESTAURANT_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SAVED_RESTAURANTS_STORE)) {
        database.createObjectStore(SAVED_RESTAURANTS_STORE, {
          keyPath: "vendorId",
        });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to open customer storage"));
    request.onblocked = () => reject(new Error("Customer storage upgrade blocked"));
  });
}

export function createIndexedDbSavedRestaurantRepository({
  indexedDB,
  databaseName = DEFAULT_DATABASE_NAME,
}: IndexedDbRepositoryOptions): SavedRestaurantRepository {
  const database = openCustomerDatabase(indexedDB, databaseName);

  return {
    async list() {
      const db = await database;
      const transaction = db.transaction(SAVED_RESTAURANTS_STORE, "readonly");
      const completed = transactionComplete(transaction);
      const rows = await requestResult(
        transaction.objectStore(SAVED_RESTAURANTS_STORE).getAll()
      );
      await completed;
      return sortSavedRestaurants(rows as SavedRestaurant[]);
    },
    async save(restaurant) {
      const db = await database;
      const transaction = db.transaction(SAVED_RESTAURANTS_STORE, "readwrite");
      transaction.objectStore(SAVED_RESTAURANTS_STORE).put({ ...restaurant });
      await transactionComplete(transaction);
      return { ...restaurant };
    },
    async remove(vendorId) {
      const db = await database;
      const transaction = db.transaction(SAVED_RESTAURANTS_STORE, "readwrite");
      transaction.objectStore(SAVED_RESTAURANTS_STORE).delete(vendorId);
      await transactionComplete(transaction);
    },
  };
}
