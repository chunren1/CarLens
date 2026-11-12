import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { AuthUser } from "@wangshu/shared";
import { api, ApiError } from "../lib/api";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(null);
  const loaded = ref(false);
  const loading = ref(false);
  const isLoggedIn = computed(() => user.value !== null);

  async function loadMe(force = false): Promise<AuthUser | null> {
    if (loaded.value && !force) return user.value;
    loading.value = true;
    try {
      user.value = (await api.me()).user;
      return user.value;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        user.value = null;
        return null;
      }
      throw error;
    } finally {
      loaded.value = true;
      loading.value = false;
    }
  }

  async function login(email: string, password: string): Promise<AuthUser> {
    const result = await api.login(email, password);
    user.value = result.user;
    loaded.value = true;
    return result.user;
  }

  async function register(input: { email: string; password: string; name: string }): Promise<AuthUser> {
    const result = await api.register(input);
    user.value = result.user;
    loaded.value = true;
    return result.user;
  }

  async function logout(): Promise<void> {
    await api.logout();
    user.value = null;
    loaded.value = true;
  }

  return { user, loaded, loading, isLoggedIn, loadMe, login, register, logout };
});
