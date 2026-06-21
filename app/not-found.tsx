import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zt-blush-bg px-6 text-center">
      <h1 className="font-serif text-4xl text-zt-brown">Vendor not found</h1>
      <p className="mt-3 text-zt-warm">
        This storefront link doesn&apos;t exist yet.
      </p>
      <Link
        href="/inka-steakhouse"
        className="mt-6 rounded-2xl bg-zt-brown-dark px-6 py-3 text-sm font-bold text-white"
      >
        View demo storefront
      </Link>
    </div>
  );
}
