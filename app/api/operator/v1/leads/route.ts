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
  listOperatorLeads,
  updateOperatorLeadStatus,
} from "@/lib/operator-control/leads";
import type { LeadStatus } from "@/lib/leads/types";

const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "ONBOARDED",
  "CLOSED",
];

function isLeadStatus(value: unknown): value is LeadStatus {
  return LEAD_STATUSES.includes(value as LeadStatus);
}

export async function GET(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const url = new URL(request.url);
      const search = readSearchParam(url, "search");
      const statusParam = readSearchParam(url, "status");
      let status: LeadStatus | undefined;
      if (statusParam) {
        if (!isLeadStatus(statusParam)) {
          return operatorJson({ error: "Invalid lead status" }, 400);
        }
        status = statusParam;
      }
      const leads = await listOperatorLeads({
        search,
        status,
      });
      return operatorJson({ leads });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function PATCH(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<{ leadId?: string; status?: string }>(
        request
      );
      if (!body.leadId) {
        return operatorJson({ error: "leadId is required" }, 400);
      }
      if (!isLeadStatus(body.status)) {
        return operatorJson({ error: "Invalid lead status" }, 400);
      }

      const lead = await updateOperatorLeadStatus(body.leadId, body.status);
      if (!lead) {
        return operatorJson({ error: "Lead not found" }, 404);
      }
      return operatorJson({ lead });
    } catch (error) {
      return operatorError(error);
    }
  });
}
