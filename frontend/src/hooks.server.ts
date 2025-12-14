// src/hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const log = {
  info: (msg: string, data?: any) =>
    console.log(`[AUTH HOOK INFO] ${msg}`, data || ""),
  debug: (msg: string, data?: any) =>
    console.log(`[AUTH HOOK DEBUG] ${msg}`, data || ""),
  error: (msg: string, err?: any) =>
    console.error(`[AUTH HOOK ERROR] ${msg}`, err || ""),
};

const BACKEND_URL = "http://localhost:8080";

const handleAuth: Handle = async ({ event, resolve }) => {
  const accessToken = event.cookies.get("accessToken");
  const refreshToken = event.cookies.get("refreshToken");

  // Reset locals
  event.locals.user = null;
  event.locals.accessToken = null;

  // Fast path: valid access token → validate via /me (most secure)
  if (accessToken) {
    try {
      const res = await event.fetch(`${BACKEND_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const user = await res.json();
        event.locals.user = user;
        event.locals.accessToken = accessToken;
        log.debug("User authenticated via valid access token", {
          userId: user.id,
        });
        return resolve(event);
      } else {
        log.info("Access token invalid/expired", { status: res.status });
        event.cookies.delete("accessToken", { path: "/" });
      }
    } catch (err) {
      log.error("Failed to validate access token", err);
    }
  }

  // Slow path: no valid access token → try refresh
  if (refreshToken) {
    log.info("No valid access token → attempting refresh");

    try {
      const res = await event.fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        const text = await res.text();
        log.error(`Refresh failed: ${res.status}`, text);
        event.cookies.delete("refreshToken", { path: "/" });
        return resolve(event);
      }

      const data = await res.json();

      // Set new cookies
      event.cookies.set("accessToken", data.access_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 60 * 15, // 15 min
      });

      if (data.refresh_token) {
        event.cookies.set("refreshToken", data.refresh_token, {
          path: "/",
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      // Now validate the new access token properly
      const meRes = await event.fetch(`${BACKEND_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      if (meRes.ok) {
        const user = await meRes.json();
        event.locals.user = user;
        event.locals.accessToken = data.access_token;
        log.info("Token refreshed + user validated", { userId: user.id });
      } else {
        log.error("Refresh succeeded but /me failed");
      }
    } catch (err) {
      log.error("Refresh failed", err);
      event.cookies.delete("refreshToken", { path: "/" });
    }
  }

  return resolve(event);
};

export const handle = sequence(handleAuth);
