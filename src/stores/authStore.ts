import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    isLoggedIn: false,
    user: { id: 1, username: "alice_dev", name: "Alice Developer" } as null | {
      id: number; username: string; name: string;
    },
  }),
  actions: {
    loginMock() { this.isLoggedIn = true; },
    logout() { this.isLoggedIn = false; },
  },
});
