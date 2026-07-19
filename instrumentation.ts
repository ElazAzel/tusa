import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { recordPlatformError } = await import("@/lib/observability");
    await recordPlatformError({
      source: "server",
      route: context.routePath || request.path,
      method: request.method,
      error,
      context: { routeType: context.routeType, routerKind: context.routerKind, renderSource: context.renderSource ?? "" },
    });
  } catch (telemetryError) {
    console.error("[observability] failed to record request error", telemetryError);
  }
};
