import { useState, useCallback, useEffect } from "react";
import { SlideProps, Logger } from "../types";

/**
 * Vegas核心状态管理钩子
 * @param initialSlide
 * @param slides
 * @param loop
 * @param shuffle
 * @param isTransitioning
 * @param firstTransition
 * @param firstTransitionDuration
 * @param log
 * @param onWalk
 */
export const useVegasState = (
	initialSlide: number,
	slides: SlideProps[],
	loop: boolean,
	shuffle: boolean,
	isTransitioning: boolean,
	firstTransition: string | null,
	firstTransitionDuration: number,
	log: Logger,
	onWalk?: () => void
) => {
	const [currentSlide, setCurrentSlide] = useState(initialSlide);
	const [isPlaying, setIsPlaying] = useState(false);
	const [slideOrder, setSlideOrder] = useState<number[]>([]);
	const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
	const [visibleSlides, setVisibleSlides] = useState([initialSlide]);
	const [isFirstTransition, setIsFirstTransition] = useState(true);

	// 初始化顺序
	useEffect(() => {
		const order = Array.from({length: slides.length}, (_, i) => i);
		if (shuffle) {
			for (let i = order.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[order[i], order[j]] = [order[j], order[i]];
			}
			const initialSlideIndex = order[0];
			setCurrentSlide(initialSlideIndex);
			setVisibleSlides([initialSlideIndex]);
			setCurrentOrderIndex(0);
			log("幻灯片随机排序完成:", order);

			if (firstTransition) {
				log(`设置第一个幻灯片的动画: ${firstTransition}`);
				slides[order[0]].transition = firstTransition;
				slides[order[0]].transitionDuration = firstTransitionDuration;
			}
		} else {
			setCurrentSlide(initialSlide);
			setVisibleSlides([initialSlide]);
			setCurrentOrderIndex(initialSlide);
		}
		setSlideOrder(order);
	}, []);

	// 播放控制
	const play = useCallback(() => {
		log("开始播放幻灯片");
		setIsPlaying(true);
	}, []);

	const pause = useCallback(() => {
		log("暂停播放幻灯片");
		setIsPlaying(false);
	}, []);

	// 切换到指定幻灯片
	const goTo = useCallback((index: number) => {
		if (index >= 0 && index < slides.length && !isTransitioning) {
			log(`切换到幻灯片: ${index}`);
			setVisibleSlides([index]);
			setCurrentSlide(index);
			onWalk?.();

			if (isFirstTransition) {
				setIsFirstTransition(false);
			}
		}
	}, [slides.length, isTransitioning, onWalk]);

	// 下一页逻辑
	const next = useCallback(() => {
		if (isTransitioning) {
			log("正在切换中,跳过本次切换");
			return;
		}

		let nextOrderIndex = currentOrderIndex + 1;
		if (nextOrderIndex >= slideOrder.length) {
			if (loop) {
				nextOrderIndex = 0;
				log("到达最后一张,循环回到第一张");
			} else {
				log("到达最后一张,停止播放");
				pause();
				return;
			}
		}

		const nextSlideIndex = slideOrder[nextOrderIndex];
		setCurrentOrderIndex(nextOrderIndex);
		goTo(nextSlideIndex);
	}, [currentOrderIndex, slideOrder, isTransitioning, loop, goTo, pause]);

	// 上一页逻辑
	const previous = useCallback(() => {
		if (isTransitioning) {
			log("正在切换中,跳过本次切换");
			return;
		}

		let prevOrderIndex = currentOrderIndex - 1;
		if (prevOrderIndex < 0) {
			if (loop) {
				prevOrderIndex = slideOrder.length - 1;
				log("到达第一张,循环到最后一张");
			} else {
				log("到达第一张,停止播放");
				pause();
				return;
			}
		}

		const prevSlideIndex = slideOrder[prevOrderIndex];
		setCurrentOrderIndex(prevOrderIndex);
		goTo(prevSlideIndex);
	}, [currentOrderIndex, slideOrder, isTransitioning, loop, goTo, pause]);

	return {
		currentSlide,
		isPlaying,
		setIsPlaying,
		slideOrder,
		currentOrderIndex,
		visibleSlides,
		isFirstTransition,
		setIsFirstTransition,
		play,
		pause,
		next,
		previous,
		goTo
	};
};
