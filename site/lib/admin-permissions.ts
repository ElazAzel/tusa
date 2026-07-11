export const ADMIN_ROLES = [
  "owner",
  "admin",
  "moderator",
  "analyst",
  "support",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "dashboard_read",
  "waitlist_read",
  "waitlist_write",
  "users_read",
  "parties_read",
  "promos_read",
  "promos_write",
  "analytics_read",
  "ads_read",
  "ads_write",
  "team_read",
  "team_manage",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  owner: [...ADMIN_PERMISSIONS],
  admin: [...ADMIN_PERMISSIONS],
  moderator: [
    "dashboard_read",
    "waitlist_read",
    "waitlist_write",
    "users_read",
    "parties_read",
    "promos_read",
  ],
  analyst: [
    "dashboard_read",
    "waitlist_read",
    "users_read",
    "parties_read",
    "promos_read",
    "analytics_read",
    "ads_read",
  ],
  support: ["dashboard_read", "waitlist_read", "users_read", "parties_read"],
};
