import type { Actions } from "./$types";
import { redirect } from "@sveltejs/kit";

export const actions = {
  default: async ({ cookies }) => {
    console.log("[SIGNOUT] Attempting to clear refresh token");

    // Clear the refresh token cookie
    cookies.delete("refreshToken", {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    cookies.delete("accessToken", {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    console.log("[SIGNOUT] Refresh token cleared, redirecting to signin");

    // Redirect to signin page
    throw redirect(303, "/signin");
  },
} satisfies Actions;
