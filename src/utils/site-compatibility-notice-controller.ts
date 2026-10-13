import { definePersistentIsland } from "@/utils/swup-lifecycle";

export function initSiteCompatibilityNotice(): void {
	definePersistentIsland("site-compatibility-notice", () => {
		const notice = document.getElementById("site-compatibility-notice");
		const dismiss = notice?.querySelector<HTMLButtonElement>(
			"[data-compatibility-dismiss]",
		);
		if (!notice || !dismiss) return;

		// 横条位于 Swup 容器外：关闭状态随站内导航保留，不写入存储或探测插件。
		dismiss.addEventListener("click", () => {
			notice.hidden = true;
		});
	});
}
