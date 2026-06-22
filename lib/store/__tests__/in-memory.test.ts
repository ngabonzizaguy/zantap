import { createInMemoryStore } from "@/lib/store/in-memory";
import {
  runPaymentContract,
  runStoreContract,
} from "@/lib/store/__tests__/contract";

runStoreContract("in-memory adapter", () => createInMemoryStore());
runPaymentContract("in-memory adapter", () => createInMemoryStore());
