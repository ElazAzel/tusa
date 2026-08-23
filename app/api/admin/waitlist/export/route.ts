import { isAdmin } from "@/lib/admin-auth";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { listWaitlistApplications } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

function escapeCsv(value: string | boolean) {
  const text = String(value).replaceAll('"', '""');
  return `"${/^[=+\-@\t\r]/.test(text) ? `'${text}` : text}"`;
}

export async function GET(request: Request) {
  if (!(await isAdmin("waitlist_read"))) return new Response("Unauthorized", { status: 401 });
  const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:admin:waitlist:export`, 60, 60000);
  if (!rl.allowed) return new Response("Too Many Requests", { status: 429 });
  const applications = await listWaitlistApplications();
  const lines = [
    ["id", "name", "city", "contact", "beta", "status", "notes", "submitted_at", "updated_at"].join(","),
    ...applications.map((item) => [item.id, item.name, item.city, item.contact, item.beta, item.status, item.notes, item.submittedAt, item.updatedAt].map(escapeCsv).join(",")),
  ];
  return new Response(`\uFEFF${lines.join("\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=tusa-game-waitlist.csv",
      "Cache-Control": "no-store",
    },
  });
}
