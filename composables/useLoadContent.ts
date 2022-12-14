import { useUiStore } from "~/stores/ui";
import { useAuthStore } from "~/stores/auth";
import { useProfileStore } from "~/stores/profile";
import { useDataStore } from "~/stores/data";

export default async function useLoadContent() {
	const uiStore = useUiStore();
	const authStore = useAuthStore();
	const profileStore = useProfileStore();
	const dataStore = useDataStore();

	if (authStore.isLoggedIn && !authStore.initialized) {
		uiStore.toggleAppLoading(true);
		uiStore.toggleSidebar(true);
		uiStore.setWidth();
		if (uiStore.width < 440) {
			uiStore.toggleSidebar(false);
		}
		await profileStore.fetchProfile();
		await dataStore.callFetchChartData();

		setTimeout(() => {
			uiStore.toggleAppLoading(false);
		}, 1000);
	}
}
