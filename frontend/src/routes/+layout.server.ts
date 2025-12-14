import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  // This makes the user available to ALL pages
  return {
    user: locals.user,
  };
};
