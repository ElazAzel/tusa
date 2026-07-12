import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  adminProfileExists,
  createAdminMember,
  deleteAdminMember,
  getAdminMember,
  listAdminAudit,
  listAdminMembers,
  updateAdminMember,
} from "@/lib/admin-members";
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLES,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin-permissions";
import { getAdminAccess } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function cleanPermissions(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const allowed = new Set<AdminPermission>(ADMIN_PERMISSIONS);
  return value.filter(
    (item): item is AdminPermission =>
      typeof item === "string" && allowed.has(item as AdminPermission),
  );
}

function responseForAccess(
  access: Awaited<ReturnType<typeof getAdminAccess>>,
  permission: AdminPermission,
) {
  if (!access)
    return NextResponse.json(
      { error: "Нужен вход администратора." },
      { status: 401 },
    );
  if (!access.permissions.includes(permission))
    return NextResponse.json(
      { error: "Недостаточно прав для этого действия." },
      { status: 403 },
    );
  return null;
}

export async function GET(request: Request) {
  const access = await getAdminAccess();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:admin:team`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const denied = responseForAccess(access, "team_read");
  if (denied) return denied;
  if (!access)
    return NextResponse.json(
      { error: "Нужен вход администратора." },
      { status: 401 },
    );
  const [members, audit] = await Promise.all([
    listAdminMembers(),
    access.permissions.includes("team_manage")
      ? listAdminAudit()
      : Promise.resolve([]),
  ]);
  return NextResponse.json(
    { members, audit, access },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const access = await getAdminAccess();
  const denied = responseForAccess(access, "team_manage");
  if (denied) return denied;
  if (!access)
    return NextResponse.json(
      { error: "Нужен вход администратора." },
      { status: 401 },
    );
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:admin:team`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const clerkUserId =
    typeof body.clerkUserId === "string" ? body.clerkUserId.trim() : "";
  const role = ADMIN_ROLES.includes(body.role as AdminRole)
    ? (body.role as AdminRole)
    : null;
  if (!clerkUserId || !role)
    return NextResponse.json(
      { error: "Выберите пользователя и роль." },
      { status: 400 },
    );
  if (!(await adminProfileExists(clerkUserId)))
    return NextResponse.json(
      { error: "Пользователь должен сначала войти в TUSA.game." },
      { status: 404 },
    );
  if (role === "owner" && access.role !== "owner")
    return NextResponse.json(
      { error: "Только владелец может назначить владельца." },
      { status: 403 },
    );
  const member = await createAdminMember({
    clerkUserId,
    role,
    permissions: cleanPermissions(body.permissions),
    actorId: access.clerkUserId,
  });
  return NextResponse.json({ member }, { status: 201 });
}

export async function PATCH(request: Request) {
  const access = await getAdminAccess();
  const denied = responseForAccess(access, "team_manage");
  if (denied) return denied;
  if (!access)
    return NextResponse.json(
      { error: "Нужен вход администратора." },
      { status: 401 },
    );
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:admin:team`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const clerkUserId =
    typeof body.clerkUserId === "string" ? body.clerkUserId.trim() : "";
  if (!clerkUserId)
    return NextResponse.json(
      { error: "Нужен идентификатор администратора." },
      { status: 400 },
    );
  if (clerkUserId === access.clerkUserId)
    return NextResponse.json(
      { error: "Нельзя изменить собственные права из этой сессии." },
      { status: 409 },
    );
  const current = await getAdminMember(clerkUserId);
  if (!current)
    return NextResponse.json(
      { error: "Администратор не найден." },
      { status: 404 },
    );
  if (current.role === "owner" && access.role !== "owner")
    return NextResponse.json(
      { error: "Только владелец может изменять владельца." },
      { status: 403 },
    );
  const role =
    body.role === undefined
      ? undefined
      : ADMIN_ROLES.includes(body.role as AdminRole)
        ? (body.role as AdminRole)
        : null;
  if (role === null)
    return NextResponse.json({ error: "Неизвестная роль." }, { status: 400 });
  if (role === "owner" && access.role !== "owner")
    return NextResponse.json(
      { error: "Только владелец может назначить владельца." },
      { status: 403 },
    );
  const status =
    body.status === "active" || body.status === "suspended"
      ? body.status
      : undefined;
  const member = await updateAdminMember({
    clerkUserId,
    role,
    status,
    permissions:
      body.permissions === undefined
        ? undefined
        : cleanPermissions(body.permissions),
    actorId: access.clerkUserId,
  });
  return NextResponse.json({ member });
}

export async function DELETE(request: Request) {
  const access = await getAdminAccess();
  const denied = responseForAccess(access, "team_manage");
  if (denied) return denied;
  if (!access)
    return NextResponse.json(
      { error: "Нужен вход администратора." },
      { status: 401 },
    );
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:admin:team`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const clerkUserId =
    typeof body.clerkUserId === "string" ? body.clerkUserId.trim() : "";
  if (!clerkUserId)
    return NextResponse.json(
      { error: "Нужен идентификатор администратора." },
      { status: 400 },
    );
  if (clerkUserId === access.clerkUserId)
    return NextResponse.json(
      { error: "Нельзя удалить собственный доступ." },
      { status: 409 },
    );
  const current = await getAdminMember(clerkUserId);
  if (!current)
    return NextResponse.json(
      { error: "Администратор не найден." },
      { status: 404 },
    );
  if (current.role === "owner" && access.role !== "owner")
    return NextResponse.json(
      { error: "Только владелец может удалить владельца." },
      { status: 403 },
    );
  const deleted = await deleteAdminMember(clerkUserId, access.clerkUserId);
  return NextResponse.json({ deleted });
}
