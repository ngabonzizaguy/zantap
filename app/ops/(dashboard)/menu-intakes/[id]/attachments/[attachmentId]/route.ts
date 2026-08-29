import { isOpsSessionValid } from "@/lib/ops-auth/session";
import { readPrivateMenuIntakeBlob } from "@/lib/menu-intake/blob-storage";
import { getStore } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  if (!(await isOpsSessionValid())) return new Response("Unauthorized", { status: 401 });
  const { id, attachmentId } = await params;
  const detail = await getStore().getMenuIntake(id);
  const attachment = detail?.attachments.find((row) => row.id === attachmentId);
  if (!attachment) return new Response("Not found", { status: 404 });
  const blob = await readPrivateMenuIntakeBlob(attachment.blobPath);
  if (!blob) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(blob.body), {
    headers: {
      "Content-Type": blob.contentType,
      "Content-Disposition": `inline; filename="${attachment.fileName.replace(/["\r\n]/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
