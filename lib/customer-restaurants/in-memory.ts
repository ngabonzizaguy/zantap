import {
  sortSavedRestaurants,
  type SavedRestaurant,
  type SavedRestaurantRepository,
  type CustomerUpdateState,
} from "@/lib/customer-restaurants/types";

export function createInMemorySavedRestaurantRepository(
  initial: SavedRestaurant[] = []
): SavedRestaurantRepository {
  const restaurants = new Map(
    initial.map((restaurant) => [restaurant.vendorId, { ...restaurant }])
  );
  const updateStates = new Map<string, CustomerUpdateState>();

  function stateFor(batchId: string): CustomerUpdateState {
    return updateStates.get(batchId) ?? {
      batchId,
      viewedRevision: 0,
      openSentRevision: 0,
      menuVisitSentRevision: 0,
    };
  }

  return {
    async list() {
      return sortSavedRestaurants(
        [...restaurants.values()].map((restaurant) => ({ ...restaurant }))
      );
    },
    async save(restaurant) {
      const saved = { ...restaurant };
      restaurants.set(saved.vendorId, saved);
      return { ...saved };
    },
    async remove(vendorId) {
      restaurants.delete(vendorId);
      for (const [batchId, state] of updateStates) {
        if (state.vendorId === vendorId) updateStates.delete(batchId);
      }
    },
    async getUpdateState(batchId) {
      const { batchId: _batchId, vendorId: _vendorId, ...state } = stateFor(batchId);
      return { ...state };
    },
    async markUpdateViewed(batchId, vendorId, revision) {
      const state = stateFor(batchId);
      updateStates.set(batchId, {
        ...state,
        vendorId,
        viewedRevision: Math.max(state.viewedRevision, revision),
      });
    },
    async markUpdateAnalyticsSent(batchId, vendorId, kind, revision) {
      const state = stateFor(batchId);
      updateStates.set(batchId, {
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
