import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const log = {
  info: (message: string, data?: any) => {
    console.log(`[ROOM PAGE INFO] ${message}`, data ? data : "");
  },
  error: (message: string, error?: any) => {
    console.error(`[ROOM PAGE ERROR] ${message}`, error ? error : "");
  },
  debug: (message: string, data?: any) => {
    console.log(`[ROOM PAGE DEBUG] ${message}`, data ? data : "");
  },
};

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const roomID = params.roomID;

  log.info("Loading room page", { roomID, userID: locals.user?.id });

  // Check if user is authenticated
  if (!locals.user || !locals.accessToken) {
    log.error("User not authenticated, redirecting to signin");
    throw redirect(303, "/signin");
  }

  try {
    log.debug("Fetching room details from backend");

    const roomResponse = await fetch(`/api/rooms/${roomID}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${locals.accessToken}`,
      },
    });

    if (!roomResponse.ok) {
      if (roomResponse.status === 401) {
        log.error("Unauthorized - token expired");
        throw redirect(303, "/signin");
      }

      if (roomResponse.status == 404) {
        log.error("Room not found", { roomID });
        throw redirect(303, "/");
      }

      log.error("Failed to fetch room", { status: roomResponse.status });
      throw redirect(303, "/");
    }

    const roomData = await roomResponse.json();

    log.info("Room loaded successfully", {
      roomID,
      participantCount: roomData.participants?.length,
    });

    return {
      user: locals.user,
      accessToken: locals.accessToken,
      room: roomData.room,
      participants: roomData.participants || [],
    };
  } catch (error) {
    log.error("Error loading room", error);

    // If it's a redirect, re-throw it
    if (error instanceof Response) {
      throw error;
    }

    // Otherwise redirect to home
    throw redirect(303, "/");
  }
};
