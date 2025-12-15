const isServer = typeof window === "undefined";
const internalApiUrl = "http://backend:8080";

const baseUrl = isServer ? `${internalApiUrl}/api` : "/api";

export const API = {
  base: baseUrl,

  // Auth endpoints
  signup: `${baseUrl}/auth/signup`,
  signin: `${baseUrl}/auth/signin`,
  refreshToken: `${baseUrl}/auth/refresh`,

  // User endpoints
  userMe: `${baseUrl}/user/me`,
  getAllUsers: `${baseUrl}/user`,

  // Room endpoints
  createRoom: `${baseUrl}/rooms`,
  getUserRooms: `${baseUrl}/rooms`,

  // Voice message endpoints
  uploadVoiceMessage: `${baseUrl}/messages`,
};

// Helper functions for dynamic URLs (with parameters)
export const APIHelpers = {
  // User endpoints with parameters
  getUserById: (id: string) => `${baseUrl}/user/${id}`,
  getUserByEmail: (email: string) => `${baseUrl}/user/email/${email}`,
  deleteUser: (id: string) => `${baseUrl}/user/${id}`,

  // Room endpoints with parameters
  getRoomById: (roomId: string) => `${baseUrl}/rooms/${roomId}`,
  deleteRoom: (roomId: string) => `${baseUrl}/rooms/${roomId}`,
  addParticipant: (roomId: string) => `${baseUrl}/rooms/${roomId}/participants`,
  removeParticipant: (roomId: string, userId: string) =>
    `${baseUrl}/rooms/${roomId}/participants/${userId}`,
  getParticipants: (roomId: string) =>
    `${baseUrl}/rooms/${roomId}/participants`,

  // Voice message endpoints with parameters
  getVoiceMessage: (messageId: string) => `${baseUrl}/messages/${messageId}`,
  deleteVoiceMessage: (messageId: string) => `${baseUrl}/messages/${messageId}`,
  getMessagesByRoom: (roomId: string) => `${baseUrl}/messages/room/${roomId}`,

  // Websockets
  websocketURLconn: (roomId: string, token: any) =>
    `${baseUrl}/ws?room_id=${roomId}&token=${token}`,
};
