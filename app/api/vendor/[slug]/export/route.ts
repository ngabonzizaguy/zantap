import { getStore } from "@/lib/store";
import {
  buildCsv,
  buildXlsxBuffer,
  exportFilename,
  ExportRowCapError,
  fetchAllFilteredOrders,
  parseExportFiltersFromSearchParams,
} from "@/lib/vendor/export-orders";
import { assertOwnerToken, OwnerTokenError } from "@/lib/vendor/owner-token-guard";

export const dynamic = "force-dynamic";

const OWNER_TOKEN_HEADER = "x-vendor-owner-token";

function readOwnerToken(request: Request): string {
  const header = request.headers.get(OWNER_TOKEN_HEADER);
  if (header) return header;
  return new URL(request.url).searchParams.get("ownerToken") ?? "";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  try {
    await assertOwnerToken(slug, readOwnerToken(request));
  } catch (error) {
    if (error instanceof OwnerTokenError) {
      return Response.json(
        { error: error.message, code: "OWNER_TOKEN_INVALID" },
        { status: 403 }
      );
    }
    throw error;
  }

  const store = getStore();
  const vendor = await store.getVendorBySlug(slug);
  if (!vendor) {
    return new Response("Not found", { status: 404 });
  }

  const params = new URL(request.url).searchParams;
  const format = params.get("format");
  if (format !== "csv" && format !== "xlsx") {
    return Response.json(
      { error: 'Query param "format" must be csv or xlsx', code: "INVALID_FORMAT" },
      { status: 400 }
    );
  }

  const filters = parseExportFiltersFromSearchParams(params);

  try {
    const [rows, allTimePaidRevenue] = await Promise.all([
      fetchAllFilteredOrders(store, slug, filters),
      store.getAllTimePaidRevenue(slug),
    ]);
    const filename = exportFilename(slug, format);

    if (format === "csv") {
      const body = buildCsv(rows, allTimePaidRevenue);
      return new Response(body, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const buffer = await buildXlsxBuffer(rows, allTimePaidRevenue);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof ExportRowCapError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
          total: error.total,
        },
        { status: 413 }
      );
    }
    throw error;
  }
}
