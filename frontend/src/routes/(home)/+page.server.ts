import { redirect, fail } from "@sveltejs/kit";

import type { PageServerLoad } from "../(auth)/signin/$types";
import type { Actions } from "@sveltejs/kit";

const log = {
  info: (message: string, data?: any) => {
    console.log(`[ROOM INFO] ${message}`, data ? data : "");
  },
  error: (message: string, error?: any) => {
    console.error(`[ROOM ERROR] ${message}`, error ? error : "");
  },
  debug: (message: string, data?: any) => {
    console.log(`[ROOM DEBUG] ${message}`, data ? data : "");
  },
};

export const load: PageServerLoad = async ({ fetch, locals }) => {
  // If user is not authenticated, redirect to signin
  if (!locals.user) {
    throw redirect(303, "/signin");
  }

  log.info("Loading home page for user", { userId: locals.user.id });

  try {
    log.debug("Fetching user rooms");

    // Fetch all rooms the user is part of
    const roomsResponse = await fetch("/api/rooms", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${locals.accessToken}`,
      },
    });

    if (!roomsResponse.ok) {
      if (roomsResponse.status == 401) {
        log.error("Unauthorized - token expired");
        throw redirect(303, "/signin");
      }

      log.error("Failed to fetch rooms", { status: roomsResponse.status });

      // Return user data but with empty rooms and error
      return {
        user: locals.user,
        rooms: [],
        roomsCount: 0,
        error: "Failed to load rooms",
      };
    }

    const roomsData = await roomsResponse.json();

    log.info("Rooms loaded successfully", {
      userId: locals.user.id,
      roomCount: roomsData.count,
    });

    return {
      user: locals.user,
      rooms: roomsData.rooms || [],
      roomsCount: roomsData.count || 0,
    };
  } catch (error) {
    log.error("Error loading rooms", error);

    // If it's a redirect, re-throw it
    if (error instanceof Response) {
      throw error;
    }

    // Otherwise return user data with empty rooms
    return {
      user: locals.user,
      rooms: [],
      roomsCount: 0,
      error: "An unexpected error occurred while loading rooms",
    };
  }
};

export const actions = {
  createRoom: async ({ request, locals, fetch }) => {
    // Check if user is authenticated
    if (!locals.user || !locals.accessToken) {
      log.error("Attempted to create a room without auth");
      return fail(401, { error: "You must be signed in to create a room" });
    }

    const formData = await request.formData();
    const participantEmail = formData.get("participant")?.toString()?.trim();

    log.info("Create room attempt", {
      participantEmail,
      currentUser: locals.user.email,
    });

    if (!participantEmail) {
      log.error("No participant email provided");
      return fail(400, {
        error: "Please provide a vaild email address for the participant",
      });
    }

    // Don't allow creating room with yourself
    if (participantEmail.toLowerCase() === locals.user.email.toLowerCase()) {
      log.error("User tried to create room with themselves");
      return fail(400, {
        error: "You cannot create a room with yourself",
      });
    }

    try {
      log.debug("Fetching user by email", { email: participantEmail });

      // Getting user by provided email
      const userResponse = await fetch(`/api/user/email/${participantEmail}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${locals.accessToken}`,
        },
      });

      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          log.error("User not found", { email: participantEmail });
          return fail(400, {
            error: `User with email ${participantEmail} not found`,
          });
        }

        if (userResponse.status === 401) {
          log.error("Unauthorized - token may be expired");
          return fail(401, {
            error: "Your session has expired. Please sign in again.",
          });
        }

        const errorData = await userResponse.json().catch(() => ({}));

        log.error("Failed to find user", {
          status: userResponse.status,
          errorData,
        });

        return fail(userResponse.status, {
          error: errorData.error || "Failed to find user",
        });
      }

      // Getting user ID from response
      const userData = await userResponse.json();
      const participantID = userData.id;

      if (!participantID) {
        log.error("No participant ID in response", { userData });
        return fail(400, { error: "Could not retrieve participant ID" });
      }

      log.debug("User found, creating room", {
        participantID,
        currentUserID: locals.user.id,
      });

      // Making create room request passing id from response
      const createRoomResponse = await fetch(`/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${locals.accessToken}`,
        },
        body: JSON.stringify({
          participants_ids: [participantID],
        }),
      });

      if (!createRoomResponse.ok) {
        if (createRoomResponse.status === 401) {
          log.error("Unauthorized when creating room");
          return fail(401, {
            error: "Your session has expired. Please sign in again.",
          });
        }

        const errorData = await createRoomResponse.json().catch(() => ({}));

        log.error("Failed to create room", {
          status: createRoomResponse,
          errorData,
        });

        return fail(createRoomResponse.status, {
          error: errorData.error || "Failed to create room",
        });
      }

      // Returning room data
      const roomData = await createRoomResponse.json();

      log.info("Room created successfully", {
        roomId: roomData.room?.id,
        participantCount: roomData.participants?.length,
      });

      return {
        success: true,
        message: "Room created successfully",
        room: roomData.room,
        participants: roomData.participants,
      };
    } catch (error) {
      log.error("Create room error - network or parsing issue", error);
      return fail(500, {
        error: "An unexpected error occurred. Please try again.",
      });
    }
  },
} satisfies Actions;
