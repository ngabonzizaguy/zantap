import { getStore } from "@/lib/store";
import {
  buildCsv,
  buildXlsxBuffer,
  exportFilename,
  ExportRowCapError,
  fetchAllFilteredOrders,
  parseExportFiltersFromSearchParams,
} from "@/lib/vendor/export-orders";
import { assertWriteSecret, WriteSecretError } from "@/lib/vendor/write-secret";

export const dynamic = "force-dynamic";

const WRITE_SECRET_HEADER = "x-vendor-write-secret";

function readWriteSecret(request: Request): string {
  const header = request.headers.get(WRITE_SECRET_HEADER);
  if (header) return header;
  return new URL(request.url).searchParams.get("writeSecret") ?? "";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  try {
    assertWriteSecret(readWriteSecret(request));
  } catch (error) {
    if (error instanceof WriteSecretError) {
      return Response.json(
        { error: error.message, code: "WRITE_SECRET_INVALID" },
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
    const rows = await fetchAllFilteredOrders(store, slug, filters);
    const filename = exportFilename(slug, format);

    if (format === "csv") {
      const body = buildCsv(rows);
      return new Response(body, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const buffer = await buildXlsxBuffer(rows);
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
