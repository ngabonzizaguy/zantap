import {
  CUSTOMER_RESTAURANT_DB_VERSION,
  sortSavedRestaurants,
  type SavedRestaurant,
  type SavedRestaurantRepository,
  type CustomerUpdateState,
} from "@/lib/customer-restaurants/types";

const DEFAULT_DATABASE_NAME = "zantap-customer";
const SAVED_RESTAURANTS_STORE = "savedRestaurants";
const UPDATE_STATES_STORE = "updateStates";

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
      if (!database.objectStoreNames.contains(UPDATE_STATES_STORE)) {
        database.createObjectStore(UPDATE_STATES_STORE, { keyPath: "batchId" });
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

  async function readUpdateState(batchId: string): Promise<CustomerUpdateState> {
    const db = await database;
    const transaction = db.transaction(UPDATE_STATES_STORE, "readonly");
    const completed = transactionComplete(transaction);
    const row = await requestResult(
      transaction.objectStore(UPDATE_STATES_STORE).get(batchId)
    );
    await completed;
    return (row as CustomerUpdateState | undefined) ?? {
      batchId,
      viewedRevision: 0,
      openSentRevision: 0,
      menuVisitSentRevision: 0,
    };
  }

  async function writeUpdateState(state: CustomerUpdateState): Promise<void> {
    const db = await database;
    const transaction = db.transaction(UPDATE_STATES_STORE, "readwrite");
    transaction.objectStore(UPDATE_STATES_STORE).put(state);
    await transactionComplete(transaction);
  }

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
      const transaction = db.transaction(
        [SAVED_RESTAURANTS_STORE, UPDATE_STATES_STORE],
        "readwrite"
      );
      transaction.objectStore(SAVED_RESTAURANTS_STORE).delete(vendorId);
      const stateStore = transaction.objectStore(UPDATE_STATES_STORE);
      const states = await requestResult(stateStore.getAll()) as CustomerUpdateState[];
      states.forEach((state) => {
        if (state.vendorId === vendorId) stateStore.delete(state.batchId);
      });
      await transactionComplete(transaction);
    },
    async getUpdateState(batchId) {
      const { batchId: _batchId, vendorId: _vendorId, ...state } = await readUpdateState(batchId);
      return state;
    },
    async markUpdateViewed(batchId, vendorId, revision) {
      const state = await readUpdateState(batchId);
      await writeUpdateState({
        ...state,
        vendorId,
        viewedRevision: Math.max(state.viewedRevision, revision),
      });
    },
    async markUpdateAnalyticsSent(batchId, vendorId, kind, revision) {
      const state = await readUpdateState(batchId);
      await writeUpdateState({
        ...state,
        vendorId,
        ...(kind === "open"
          ? { openSentRevision: Math.max(state.openSentRevision, revision) }
          : {
              menuVisitSentRevision: Math.max(
                state.menuVisitSentRevision,
                revision
              ),
            }),
      });
    },
  };
}
