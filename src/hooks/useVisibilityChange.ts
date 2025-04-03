import { useEffect } from 'react';
import { Logger } from "../types";

/**
 * 页面可见性变化钩子
 * @param play
 * @param pause
 * @param log
 */
export const useVisibilityChange = (
	play: () => void,
	pause: () => void,
	log: Logger
) => {
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				log("页面隐藏，暂停播放幻灯片");
				pause();
			} else {
				log("页面可见，继续播放幻灯片");
				play();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [play, pause]);
};
