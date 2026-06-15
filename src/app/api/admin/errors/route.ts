import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/session";
import { deleteErrorLog, clearErrorLogs } from "@/lib/firestore/repo";

export const runtime = "nodejs";

/**
 * DELETE /api/admin/errors
 *  - Single:  ?id=<docId>   → delete one log
 *  - Clear:   ?all=1        → delete every log
 * Error logs are disposable diagnostics; the admin erases them after reading.
 */
export async function DELETE(req: NextRequest) {
  try {
    requireAdmin();
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);

  if (searchParams.get("all") === "1") {
    try {
      const deleted = await clearErrorLogs();
      return NextResponse.json({ ok: true, deleted });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to clear logs" },
        { status: 500 },
      );
    }
  }

  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  try {
    await deleteErrorLog(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete log" },
      { status: 500 },
    );
  }
}
