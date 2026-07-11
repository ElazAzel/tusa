"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import LocaleToggle from "@/app/components/LocaleToggle";
import { useLocale } from "@/app/components/LocaleProvider";
import type { AdminAccess } from "@/lib/admin-auth";
import type { AdminAuditEntry, AdminMember } from "@/lib/admin-members";
import {
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin-permissions";

type UserOption = {
  id: string;
  displayName: string;
  handle: string;
};

type Props = {
  access: AdminAccess;
  initialMembers: AdminMember[];
  initialAudit: AdminAuditEntry[];
  users: UserOption[];
};

const permissionGroups: {
  titleRu: string;
  titleEn: string;
  items: AdminPermission[];
}[] = [
  {
    titleRu: "Основное",
    titleEn: "Core",
    items: ["dashboard_read", "users_read", "parties_read"],
  },
  {
    titleRu: "Очередь",
    titleEn: "Waitlist",
    items: ["waitlist_read", "waitlist_write"],
  },
  {
    titleRu: "Промокоды",
    titleEn: "Promo codes",
    items: ["promos_read", "promos_write"],
  },
  {
    titleRu: "Аналитика и реклама",
    titleEn: "Analytics & ads",
    items: ["analytics_read", "ads_read", "ads_write"],
  },
  { titleRu: "Команда", titleEn: "Team", items: ["team_read", "team_manage"] },
];

function PermissionPicker({
  value,
  onChange,
  locale,
  disabled,
}: {
  value: AdminPermission[];
  onChange: (next: AdminPermission[]) => void;
  locale: "ru" | "en";
  disabled?: boolean;
}) {
  const labels: Record<AdminPermission, string> =
    locale === "ru"
      ? {
          dashboard_read: "Дашборд",
          waitlist_read: "Смотреть очередь",
          waitlist_write: "Менять очередь",
          users_read: "Пользователи",
          parties_read: "Тусы",
          promos_read: "Смотреть промокоды",
          promos_write: "Менять промокоды",
          analytics_read: "Аналитика",
          ads_read: "Смотреть рекламу",
          ads_write: "Менять рекламу",
          team_read: "Смотреть команду",
          team_manage: "Управлять командой",
        }
      : {
          dashboard_read: "Dashboard",
          waitlist_read: "View waitlist",
          waitlist_write: "Edit waitlist",
          users_read: "Users",
          parties_read: "Hangouts",
          promos_read: "View promo codes",
          promos_write: "Edit promo codes",
          analytics_read: "Analytics",
          ads_read: "View ads",
          ads_write: "Edit ads",
          team_read: "View team",
          team_manage: "Manage team",
        };

  function toggle(permission: AdminPermission) {
    onChange(
      value.includes(permission)
        ? value.filter((item) => item !== permission)
        : [...value, permission],
    );
  }

  return (
    <div className="permission-groups">
      {permissionGroups.map((group) => (
        <fieldset key={group.titleEn}>
          <legend>{locale === "ru" ? group.titleRu : group.titleEn}</legend>
          {group.items.map((permission) => (
            <label key={permission}>
              <input
                checked={value.includes(permission)}
                disabled={disabled}
                onChange={() => toggle(permission)}
                type="checkbox"
              />
              <span>{labels[permission]}</span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

function MemberEditor({
  member,
  access,
  locale,
  onSaved,
  onRemoved,
}: {
  member: AdminMember;
  access: AdminAccess;
  locale: "ru" | "en";
  onSaved: (member: AdminMember) => void;
  onRemoved: (id: string) => void;
}) {
  const [role, setRole] = useState(member.role);
  const [status, setStatus] = useState(member.status);
  const [permissions, setPermissions] = useState(member.permissions);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const locked =
    !access.permissions.includes("team_manage") ||
    member.clerkUserId === access.clerkUserId;
  const roleLabels: Record<AdminRole, string> =
    locale === "ru"
      ? {
          owner: "Владелец",
          admin: "Администратор",
          moderator: "Модератор",
          analyst: "Аналитик",
          support: "Поддержка",
        }
      : {
          owner: "Owner",
          admin: "Administrator",
          moderator: "Moderator",
          analyst: "Analyst",
          support: "Support",
        };

  function changeRole(next: AdminRole) {
    setRole(next);
    setPermissions([...ROLE_PERMISSIONS[next]]);
  }

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId: member.clerkUserId,
          role,
          status,
          permissions,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onSaved(data.member);
      setMessage(locale === "ru" ? "Права сохранены." : "Access saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : locale === "ru"
            ? "Не удалось сохранить."
            : "Could not save.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        locale === "ru"
          ? "Удалить доступ этого администратора?"
          : "Remove this administrator's access?",
      )
    )
      return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: member.clerkUserId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onRemoved(member.clerkUserId);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : locale === "ru"
            ? "Не удалось удалить."
            : "Could not remove.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="team-member-card">
      <header>
        <div
          className="team-avatar"
          style={
            member.imageUrl
              ? {
                  backgroundImage: `url("${member.imageUrl.replaceAll('"', "%22")}")`,
                }
              : undefined
          }
        >
          {member.imageUrl
            ? null
            : member.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <strong>{member.displayName}</strong>
          <span>
            {member.handle ? `@${member.handle}` : member.clerkUserId}
          </span>
        </div>
        <b className={`team-status team-status--${status}`}>
          {status === "active"
            ? locale === "ru"
              ? "активен"
              : "active"
            : locale === "ru"
              ? "приостановлен"
              : "suspended"}
        </b>
      </header>
      <div className="team-member-controls">
        <label>
          {locale === "ru" ? "Роль" : "Role"}
          <select
            value={role}
            disabled={locked}
            onChange={(event) => changeRole(event.target.value as AdminRole)}
          >
            {ADMIN_ROLES.map((option) => (
              <option
                key={option}
                value={option}
                disabled={option === "owner" && access.role !== "owner"}
              >
                {roleLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {locale === "ru" ? "Статус" : "Status"}
          <select
            value={status}
            disabled={locked}
            onChange={(event) =>
              setStatus(event.target.value as "active" | "suspended")
            }
          >
            <option value="active">
              {locale === "ru" ? "Активен" : "Active"}
            </option>
            <option value="suspended">
              {locale === "ru" ? "Приостановлен" : "Suspended"}
            </option>
          </select>
        </label>
      </div>
      <PermissionPicker
        value={permissions}
        onChange={setPermissions}
        locale={locale}
        disabled={locked}
      />
      {locked && (
        <p className="team-helper">
          {member.clerkUserId === access.clerkUserId
            ? locale === "ru"
              ? "Собственные права нельзя изменить из текущей сессии."
              : "You cannot change your own access from this session."
            : locale === "ru"
              ? "Роль доступна только для просмотра."
              : "This role is view-only."}
        </p>
      )}
      {message && (
        <p className="admin-notice" role="status">
          {message}
        </p>
      )}
      {!locked && (
        <footer>
          <button
            className="admin-button admin-button--lime"
            disabled={busy}
            onClick={save}
            type="button"
          >
            {busy ? "…" : locale === "ru" ? "Сохранить" : "Save"}
          </button>
          <button
            className="admin-delete"
            disabled={busy}
            onClick={remove}
            type="button"
          >
            {locale === "ru" ? "Удалить доступ" : "Remove access"}
          </button>
        </footer>
      )}
    </article>
  );
}

export default function TeamConsole({
  access,
  initialMembers,
  initialAudit,
  users,
}: Props) {
  const { locale } = useLocale();
  const [members, setMembers] = useState(initialMembers);
  const [audit, setAudit] = useState(initialAudit);
  const [role, setRole] = useState<AdminRole>("moderator");
  const [permissions, setPermissions] = useState<AdminPermission[]>([
    ...ROLE_PERMISSIONS.moderator,
  ]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const canManage = access.permissions.includes("team_manage");
  const availableUsers = useMemo(
    () =>
      users.filter(
        (user) => !members.some((member) => member.clerkUserId === user.id),
      ),
    [members, users],
  );
  const roleLabels: Record<AdminRole, string> =
    locale === "ru"
      ? {
          owner: "Владелец",
          admin: "Администратор",
          moderator: "Модератор",
          analyst: "Аналитик",
          support: "Поддержка",
        }
      : {
          owner: "Owner",
          admin: "Administrator",
          moderator: "Moderator",
          analyst: "Analyst",
          support: "Support",
        };

  function changeRole(next: AdminRole) {
    setRole(next);
    setPermissions([...ROLE_PERMISSIONS[next]]);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId: form.get("clerkUserId"),
          role,
          permissions,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMembers((current) => [
        ...current.filter(
          (item) => item.clerkUserId !== data.member.clerkUserId,
        ),
        data.member,
      ]);
      formElement.reset();
      setRole("moderator");
      setPermissions([...ROLE_PERMISSIONS.moderator]);
      setMessage(
        locale === "ru" ? "Администратор добавлен." : "Administrator added.",
      );
      const refreshed = await fetch("/api/admin/team", {
        cache: "no-store",
      }).then((result) => result.json());
      if (Array.isArray(refreshed.audit)) setAudit(refreshed.audit);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : locale === "ru"
            ? "Не удалось добавить."
            : "Could not add.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page team-admin-page">
      <header className="admin-header">
        <Link href="/admin" className="admin-brand">
          TUSA<span>.game</span>
        </Link>
        <div className="admin-nav">
          <LocaleToggle />
          <Link href="/admin" className="admin-text-button">
            {locale === "ru" ? "Консоль" : "Console"}
          </Link>
          <span className="admin-role-chip">
            {access.displayName} · {access.role}
          </span>
        </div>
      </header>

      <section className="admin-hero team-admin-hero">
        <div>
          <span className="admin-kicker">
            {locale === "ru" ? "роли и безопасность" : "roles & security"}
          </span>
          <h1>
            {locale === "ru" ? (
              <>
                Команда
                <br />
                <span>доступа.</span>
              </>
            ) : (
              <>
                Access
                <br />
                <span>team.</span>
              </>
            )}
          </h1>
          <p>
            {locale === "ru"
              ? "Назначай администраторов через их аккаунты TUSA.game и выдавай только нужные разрешения."
              : "Assign administrators through their TUSA.game accounts and grant only the permissions they need."}
          </p>
        </div>
        <div className="team-summary">
          <strong>
            {members.filter((item) => item.status === "active").length}
          </strong>
          <span>
            {locale === "ru"
              ? "активных администраторов"
              : "active administrators"}
          </span>
          <small>
            {members.length} {locale === "ru" ? "всего" : "total"}
          </small>
        </div>
      </section>

      {canManage && (
        <section className="team-create-card">
          <div>
            <span className="admin-kicker">
              {locale === "ru" ? "новый участник" : "new member"}
            </span>
            <h2>{locale === "ru" ? "Выдать доступ" : "Grant access"}</h2>
            <p>
              {locale === "ru"
                ? "Пользователь сначала должен один раз войти в TUSA.game, чтобы появиться в списке."
                : "The user must sign in to TUSA.game once before appearing here."}
            </p>
          </div>
          <form onSubmit={create}>
            <label>
              {locale === "ru" ? "Пользователь" : "User"}
              <select name="clerkUserId" required defaultValue="">
                <option value="" disabled>
                  {locale === "ru" ? "Выбрать аккаунт" : "Choose account"}
                </option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} · @{user.handle}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {locale === "ru" ? "Роль" : "Role"}
              <select
                value={role}
                onChange={(event) =>
                  changeRole(event.target.value as AdminRole)
                }
              >
                {ADMIN_ROLES.map((option) => (
                  <option
                    key={option}
                    value={option}
                    disabled={option === "owner" && access.role !== "owner"}
                  >
                    {roleLabels[option]}
                  </option>
                ))}
              </select>
            </label>
            <PermissionPicker
              value={permissions}
              onChange={setPermissions}
              locale={locale}
            />
            <button
              className="admin-button admin-button--lime"
              disabled={busy || availableUsers.length === 0}
              type="submit"
            >
              {busy ? "…" : locale === "ru" ? "Выдать доступ" : "Grant access"}
            </button>
          </form>
          {message && (
            <p className="admin-notice" role="status">
              {message}
            </p>
          )}
        </section>
      )}

      <section
        className="team-grid"
        aria-label={locale === "ru" ? "Администраторы" : "Administrators"}
      >
        {members.length === 0 && (
          <p className="admin-empty">
            {locale === "ru"
              ? "Назначенных администраторов пока нет. Доступ владельца работает через пароль."
              : "No delegated administrators yet. Owner password access remains active."}
          </p>
        )}
        {members.map((member) => (
          <MemberEditor
            access={access}
            key={member.clerkUserId}
            locale={locale}
            member={member}
            onRemoved={(id) =>
              setMembers((current) =>
                current.filter((item) => item.clerkUserId !== id),
              )
            }
            onSaved={(next) =>
              setMembers((current) =>
                current.map((item) =>
                  item.clerkUserId === next.clerkUserId ? next : item,
                ),
              )
            }
          />
        ))}
      </section>

      {audit.length > 0 && (
        <section className="team-audit-card">
          <div>
            <span className="admin-kicker">
              {locale === "ru" ? "журнал безопасности" : "security log"}
            </span>
            <h2>
              {locale === "ru" ? "Последние изменения" : "Recent changes"}
            </h2>
          </div>
          <div>
            {audit.map((entry) => (
              <article key={entry.id}>
                <strong>{entry.action}</strong>
                <span>
                  {entry.actorId} → {entry.targetId || "system"}
                </span>
                <time dateTime={entry.createdAt}>
                  {new Intl.DateTimeFormat(
                    locale === "ru" ? "ru-KZ" : "en-US",
                    { dateStyle: "medium", timeStyle: "short" },
                  ).format(new Date(entry.createdAt))}
                </time>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
