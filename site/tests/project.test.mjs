import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

function sourceFiles(directory) {
  return readdirSync(directory)
    .flatMap((name) => {
      const path = join(directory, name);
      if (["node_modules", ".next", ".git", "outputs", "tmp"].includes(name)) return [];
      return statSync(path).isDirectory() ? sourceFiles(path) : [path];
    })
    .filter((path) => /\.(?:ts|tsx|css|md|json|mjs|js)$/.test(path));
}

test("official TUSA.game brand assets are present", () => {
  assert.equal(existsSync(join(root, "public", "brand", "tusa-game-logo.png")), true);
  assert.equal(existsSync(join(root, "public", "brand", "tusa-game-icon.png")), true);
});

test("project source uses the TUSA.game name consistently", () => {
  for (const path of sourceFiles(root)) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /TUSA\.io|tusa\.io/, relative(root, path));
  }
});

test("demo includes the core party modules", () => {
  const source = sourceFiles(join(root, "app", "demo")).map((path) => readFileSync(path, "utf8")).join("\n");
  for (const moduleName of ["games", "shopping", "gallery", "chat", "koins"]) {
    assert.match(source, new RegExp(`id: "${moduleName}"`));
  }
  assert.match(source, /localStorage\.setItem/);
  assert.match(source, /navigator\.share/);
  for (const gameId of ["alias", "mafia", "truth", "never", "beer", "quiz", "pairs", "uno"]) {
    assert.match(source, new RegExp(`id: "${gameId}"`));
  }
});

test("signed-in party flow and promo administration are present", () => {
  for (const file of [
    "app/app/page.tsx",
    "app/app/new/CreatePartyForm.tsx",
    "app/join/[inviteCode]/page.tsx",
    "app/api/parties/route.ts",
    "app/api/admin/promos/route.ts",
    "app/admin/promos/PromoConsole.tsx",
    "lib/parties.ts",
  ]) {
    assert.equal(existsSync(join(root, file)), true, file);
  }
  const parties = readFileSync(join(root, "lib", "parties.ts"), "utf8");
  assert.match(parties, /ELAZ/);
  assert.match(parties, /JEDAI/);
  assert.match(parties, /TUSA02/);
  assert.match(parties, /promo_redemptions/);
  const api = readFileSync(join(root, "app", "api", "parties", "route.ts"), "utf8");
  assert.match(api, /await auth\(\)/);
  assert.match(api, /700 020 47 91/);
});

test("live party room has bilingual copy and stays out of the demo flow", () => {
  const copy = readFileSync(join(root, "lib", "i18n.ts"), "utf8");
  const room = readFileSync(join(root, "app", "party", "[inviteCode]", "PartyRoom.tsx"), "utf8");
  const create = readFileSync(join(root, "app", "app", "new", "CreatePartyForm.tsx"), "utf8");
  for (const key of ["eventHubPass", "roomCoHost", "roomDeleteConfirm", "dashCoHost"]) {
    assert.match(copy, new RegExp(`${key}:`));
  }
  assert.doesNotMatch(room, /href="\/demo"/);
  assert.match(room, /formatEventDate/);
  assert.doesNotMatch(create, /type="date"/);
  assert.doesNotMatch(create, /type="time"/);
});

test("dashboard typography follows the style-guide tracking limits", () => {
  const css = readFileSync(join(root, "app", "globals.css"), "utf8");
  const manifest = readFileSync(join(root, "app", "manifest.ts"), "utf8");
  const worker = readFileSync(join(root, "public", "sw.js"), "utf8");
  assert.match(css, /user-app-hero h1[^}]+letter-spacing: -\.035em/);
  assert.match(css, /section-line h2[^}]+letter-spacing: -\.03em/);
  assert.doesNotMatch(css, /user-app-hero h1[^}]+letter-spacing: -\.1em/);
  assert.match(manifest, /start_url: "\/app"/);
  assert.doesNotMatch(manifest, /start_url: "\/demo"/);
  assert.doesNotMatch(worker, /^  "\/demo",$/m);
});
test("UNO is a playable card game instead of a score tracker", () => {
  const uno = readFileSync(join(root, "app", "components", "games", "UnoTracker.tsx"), "utf8");
  for (const rule of ["createDeck", "takeCards", "canPlay", "wild4", "draw2", "reverse", "skip", "commitCard"]) {
    assert.match(uno, new RegExp(rule));
  }
  assert.match(uno, /round < 7/);
  assert.match(uno, /setWinner/);
  assert.match(uno, /item\.color === activeColor/);
  assert.match(uno, /onSave\(points\)/);
  assert.doesNotMatch(uno, /adjust\(idx, 50\)/);
  assert.doesNotMatch(uno, /SCORE TRACKER/);
});
test("admin roles use delegated accounts and granular permissions", () => {
  for (const file of [
    "lib/admin-permissions.ts",
    "lib/admin-members.ts",
    "app/admin/team/page.tsx",
    "app/admin/team/TeamConsole.tsx",
    "app/api/admin/team/route.ts",
  ]) {
    assert.equal(existsSync(join(root, file)), true, file);
  }
  const permissions = readFileSync(join(root, "lib", "admin-permissions.ts"), "utf8");
  const auth = readFileSync(join(root, "lib", "admin-auth.ts"), "utf8");
  const teamApi = readFileSync(join(root, "app", "api", "admin", "team", "route.ts"), "utf8");
  const members = readFileSync(join(root, "lib", "admin-members.ts"), "utf8");
  const dataApi = readFileSync(join(root, "app", "api", "admin", "data", "route.ts"), "utf8");
  const proxy = readFileSync(join(root, "proxy.ts"), "utf8");
  for (const permission of ["waitlist_write", "promos_write", "analytics_read", "ads_write", "team_manage"]) {
    assert.match(permissions, new RegExp(permission));
  }
  assert.match(auth, /getAdminAccess/);
  assert.match(auth, /getAdminMember/);
  assert.match(teamApi, /team_manage/);
  assert.match(members, /admin\.member\.created/);
  assert.doesNotMatch(dataApi, /ADMIN_EMAILS|api\.clerk\.com/);
  assert.doesNotMatch(proxy, /\/api\/admin\(\.\*\)/);
});