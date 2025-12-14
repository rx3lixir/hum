import { redirect, fail } from "@sveltejs/kit";

import type { Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const log = {
  info: (message: string, data?: any) => {
    console.log(`[SIGNUP INFO] ${message}`, data ? data : "");
  },
  error: (message: string, error?: any) => {
    console.error(`[SIGNUP ERROR] ${message}`, error ? error : "");
  },
  debug: (message: string, data?: any) => {
    console.log(`[SIGNUP DEBUG] ${message}`, data ? data : "");
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
  log.debug("Loading signup page for unauthenticated user");
  return {};
};

export const actions = {
  signup: async ({ request, cookies, fetch }) => {
    const formData = await request.formData();

    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const username = formData.get("username")?.toString();

    log.info("Signup attempt", {
      email: email?.toLowerCase().trim(),
      username: username,
    });

    // Server side validation
    if (!email || !username || !password) {
      log.error("Validation failed: missing email, username or password");
      return fail(400, {
        error: "Email, username and password are required",
        email: email || "",
        username: username || "",
      });
    }

    try {
      log.debug("Sending signup request to backend");

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          username: username.trim(),
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        log.error(`Signup failed with status ${response.status}`, {
          error: errorData.error,
          email: email.toLowerCase().trim(),
          username: username.trim(),
        });

        return fail(response.status, {
          error: errorData.error || "Sign up failed",
          email,
          username,
        });
      }

      const data = await response.json();

      log.info("Signup successful", {
        userId: data.user.id,
        username: data.user.username,
        email: data.user.email,
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token,
      });

      // Storing refresh token in http-only cookie (same as signin)
      cookies.set("refreshToken", data.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: false, // Set true with HTTPS
        sameSite: "lax", // Changed to lax!
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
      log.error("Signup error - network or parsing issue", error);

      return fail(500, {
        error: "An unexpected error occured. Please try again",
      });
    }
  },
} satisfies Actions;
