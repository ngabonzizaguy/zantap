import { listVendors } from "@/lib/operator-client";
import { VendorDirectory } from "@/components/ops/VendorDirectory";

export default async function OpsHomePage() {
  const vendors = await listVendors();
  return <VendorDirectory vendors={vendors} />;
}
