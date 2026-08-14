import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import {
  readSearchParam,
  withOperatorAuth,
} from "@/lib/operator-control/route-helper";
import {
  addOperatorProspectInteraction,
  bulkCreateOperatorProspects,
  convertOperatorProspect,
  createOperatorProspect,
  listOperatorProspects,
  updateOperatorProspect,
} from "@/lib/operator-control/prospects";
import type { ProspectStatus } from "@/lib/prospects/types";

const PROSPECT_STATUSES: ProspectStatus[] = [
  "FOUND",
  "CONTACTED",
  "IN_TALKS",
  "CONVERTED",
  "DECLINED",
  "UNREACHABLE",
];

function isProspectStatus(value: unknown): value is ProspectStatus {
  return PROSPECT_STATUSES.includes(value as ProspectStatus);
}

export async function GET(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const url = new URL(request.url);
      const search = readSearchParam(url, "search");
      const statusParam = readSearchParam(url, "status");
      let status: ProspectStatus | undefined;
      if (statusParam) {
        if (!isProspectStatus(statusParam)) {
          return operatorJson({ error: "Invalid prospect status" }, 400);
        }
        status = statusParam;
      }
      const prospects = await listOperatorProspects({ search, status });
      return operatorJson({ prospects });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function POST(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<{
        rows?: Array<{ businessName: string; phone?: string; area?: string; source?: string }>;
        businessName?: string;
        contactName?: string;
        phone?: string;
        area?: string;
        source?: string;
        mapsUrl?: string;
        instagramHandle?: string;
        notes?: string;
        nextFollowUpAt?: string;
        // interaction
        prospectId?: string;
        channel?: string;
        note?: string;
        // convert
        action?: string;
        vendorId?: string;
        leadId?: string;
      }>(request);

      if (body.action === "interact" && body.prospectId && body.channel) {
        const interaction = await addOperatorProspectInteraction(
          body.prospectId,
          { channel: body.channel as never, note: body.note }
        );
        if (!interaction) {
          return operatorJson({ error: "Prospect not found" }, 404);
        }
        return operatorJson({ interaction });
      }

      if (body.action === "convert" && body.prospectId && body.vendorId) {
        const prospect = await convertOperatorProspect(
          body.prospectId,
          body.vendorId,
          body.leadId
        );
        if (!prospect) {
          return operatorJson({ error: "Prospect not found" }, 404);
        }
        return operatorJson({ prospect });
      }

      if (body.rows && Array.isArray(body.rows)) {
        if (body.rows.length === 0) {
          return operatorJson({ error: "rows must not be empty" }, 400);
        }
        const invalid = body.rows.find((r: { businessName?: string }) => !r.businessName?.trim());
        if (invalid) {
          return operatorJson(
            { error: "Every row must have a businessName" },
            400
          );
        }
        const prospects = await bulkCreateOperatorProspects({ rows: body.rows });
        return operatorJson({ prospects }, 201);
      }

      if (!body.businessName?.trim()) {
        return operatorJson({ error: "businessName is required" }, 400);
      }
      const prospect = await createOperatorProspect({
        businessName: body.businessName.trim(),
        contactName: body.contactName?.trim() || undefined,
        phone: body.phone?.trim() || undefined,
        area: body.area?.trim() || undefined,
        source: body.source?.trim() || undefined,
        mapsUrl: body.mapsUrl?.trim() || undefined,
        instagramHandle: body.instagramHandle?.trim() || undefined,
        notes: body.notes?.trim() || undefined,
        nextFollowUpAt: body.nextFollowUpAt
          ? new Date(body.nextFollowUpAt)
          : undefined,
      });
      return operatorJson({ prospect }, 201);
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function PATCH(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<{
        prospectId?: string;
        status?: string;
        businessName?: string;
        contactName?: string | null;
        phone?: string | null;
        area?: string | null;
        source?: string | null;
        mapsUrl?: string | null;
        instagramHandle?: string | null;
        notes?: string | null;
        nextFollowUpAt?: string | null;
      }>(request);

      if (!body.prospectId) {
        return operatorJson({ error: "prospectId is required" }, 400);
      }

      const input: Record<string, unknown> = {};
      if (body.status !== undefined) {
        if (!isProspectStatus(body.status)) {
          return operatorJson({ error: "Invalid prospect status" }, 400);
        }
        input.status = body.status;
      }
      if (body.businessName !== undefined) input.businessName = body.businessName;
      if (body.contactName !== undefined) input.contactName = body.contactName;
      if (body.phone !== undefined) input.phone = body.phone;
      if (body.area !== undefined) input.area = body.area;
      if (body.source !== undefined) input.source = body.source;
      if (body.mapsUrl !== undefined) input.mapsUrl = body.mapsUrl;
      if (body.instagramHandle !== undefined) input.instagramHandle = body.instagramHandle;
      if (body.notes !== undefined) input.notes = body.notes;
      if (body.nextFollowUpAt !== undefined) {
        input.nextFollowUpAt = body.nextFollowUpAt
          ? new Date(body.nextFollowUpAt)
          : null;
      }

      const prospect = await updateOperatorProspect(body.prospectId, input);
      if (!prospect) {
        return operatorJson({ error: "Prospect not found" }, 404);
      }
      return operatorJson({ prospect });
    } catch (error) {
      return operatorError(error);
    }
  });
}
