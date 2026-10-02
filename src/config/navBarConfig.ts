import { LinkPresets } from "@/constants/link-presets";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import { LinkPreset, type NavBarConfig, type NavBarLink } from "@/types/config";
import { siteConfig } from "./siteConfig";

const buildNavBarConfig = (): NavBarConfig => {
	const postsChildren: (NavBarLink | LinkPreset)[] = [];
	if (siteConfig.pages.postList) postsChildren.push(LinkPreset.PostList);
	if (siteConfig.pages.archive) postsChildren.push(LinkPreset.Archive);
	if (siteConfig.pages.categories) postsChildren.push(LinkPreset.Categories);

	const aboutChildren: (NavBarLink | LinkPreset)[] = [];
	if (siteConfig.pages.about) {
		aboutChildren.push({
			...LinkPresets[LinkPreset.About],
			name: i18n(I18nKey.aboutMe),
		});
	}
	if (siteConfig.pages.music) aboutChildren.push(LinkPreset.Music);

	const socialChildren: (NavBarLink | LinkPreset)[] = [];
	if (siteConfig.pages.friends) socialChildren.push(LinkPreset.Friends);
	if (siteConfig.pages.fcircle) socialChildren.push(LinkPreset.Fcircle);
	if (siteConfig.pages.guestbook) socialChildren.push(LinkPreset.Guestbook);

	const links: (NavBarLink | LinkPreset)[] = [LinkPreset.Home];
	if (siteConfig.pages.collections) links.push(LinkPreset.NavLinks);
	if (postsChildren.length > 0) {
		links.push({
			...LinkPresets[LinkPreset.NavPosts],
			activePathPrefixes: ["/posts/"],
			children: postsChildren,
		});
	}
	if (siteConfig.pages.projects) links.push(LinkPreset.Projects);
	if (siteConfig.pages.life) links.push(LinkPreset.Life);
	if (socialChildren.length > 0) {
		links.push({
			...LinkPresets[LinkPreset.Social],
			children: socialChildren,
		});
	}
	if (aboutChildren.length > 0) {
		links.push({ ...LinkPresets[LinkPreset.About], children: aboutChildren });
	}
	return { links, personalSites: [] };
};

export const navBarConfig: NavBarConfig = buildNavBarConfig();
