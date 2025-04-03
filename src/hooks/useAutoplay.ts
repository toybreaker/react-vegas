import { useEffect } from 'react';
import { SlideProps, Logger } from "../types";

/**
 * 自动播放钩子
 * @param isPlaying
 * @param isTransitioning
 * @param currentSlide
 * @param slides
 * @param delay
 * @param next
 * @param log
 */
export const useAutoplay = (
	isPlaying: boolean,
	isTransitioning: boolean,
	currentSlide: number,
	slides: SlideProps[],
	delay: number,
	next: () => void,
	log: Logger
) => {
	useEffect(() => {
		let timer: number;
		if (isPlaying && !isTransitioning) {
			const currentDelay = slides[currentSlide].delay || delay;
			log(`设置自动播放定时器,延迟: ${currentDelay}ms`);
			timer = window.setInterval(next, currentDelay);
		}
		return () => {
			if (timer) {
				log("清理自动播放定时器");
				clearInterval(timer);
			}
		};
	}, [isPlaying, currentSlide, isTransitioning, next]);
};
