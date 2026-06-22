import { createInMemoryStore } from "@/lib/store/in-memory";
import { runStoreContract } from "@/lib/store/__tests__/contract";

runStoreContract("in-memory adapter", () => createInMemoryStore());
