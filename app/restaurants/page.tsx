import type { Metadata } from "next";
import { RestaurantHub } from "@/components/customer/RestaurantHub";

export const metadata: Metadata = {
  title: "Your restaurants · ZanTap",
  description: "Return to restaurants you saved on this device.",
};

export default function RestaurantsPage() {
  return <RestaurantHub />;
}
