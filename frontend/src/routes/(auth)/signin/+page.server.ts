import type { Actions } from "@sveltejs/kit";
import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const log = {
  info: (message: string, data?: any) => {
    console.log(`[SIGNIN INFO] ${message}`, data ? data : "");
  },
  error: (message: string, error?: any) => {
    console.error(`[SIGNIN ERROR] ${message}`, error ? error : "");
  },
  debug: (message: string, data?: any) => {
    console.log(`[SIGNIN DEBUG] ${message}`, data ? data : "");
  },
};

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    log.info("User already authenticated, redirecting to home", {
      userId: locals.user.id,
      username: locals.user.username,
    });
    throw redirect(303, "/");
  }
  log.debug("Loading signin page for unauthenticated user");
  return {};
};

export const actions = {
  signin: async ({ request, cookies, fetch }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    log.info("Signin attempt", { email: email?.toLowerCase().trim() });

    // Server side validation (belt and braces approach)
    if (!email || !password) {
      log.error("Validation failed: missing email or password");
      return fail(400, {
        error: "Email and password are required",
        email: email || "",
      });
    }

    try {
      log.debug("Sending signin request to backend");

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        log.error(`Signin failed with status ${response.status}`, {
          error: errorData.error,
          email: email.toLowerCase().trim(),
        });

        return fail(response.status, {
          error: errorData.error || "Sign in failed",
          email,
        });
      }

      const data = await response.json();

      log.info("Signin successful", {
        userId: data.user.id,
        username: data.user.username,
        email: data.user.email,
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token,
      });

      // Storing refresh token in http-only cookie
      cookies.set("refreshToken", data.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: false, // Set true with HTTPS
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      log.debug("Refresh token stored in httpOnly cookie");

      // Return access token and user data to the client
      return {
        success: true,
        accessToken: data.access_token,
        user: data.user,
      };
    } catch (error) {
      log.error("Signin error - network or parsing issue", error);

      return fail(500, {
        error: "An unexpected error occured. Please try again.",
        email,
      });
    }
  },
} satisfies Actions;
