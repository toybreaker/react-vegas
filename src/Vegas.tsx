import React, {useEffect, useRef, useState, useCallback} from "react";
import {VegasProps} from "./types";
import {motion} from "motion/react";
import {VegasLoader} from "./components/VegasLoader";
import {VegasTimer} from "./components/VegasTimer";
import {VegasOverlay} from "./components/VegasOverlay";
import {VegasDefaultBackground} from "./components/VegasDefaultBackground";
import {VegasSlideRenderer} from "./components/VegasSlideRenderer";
import {VegasSlide} from "./components/VegasSlide";
import {useLogger} from "./hooks/useLogger";
import {usePreload} from "./hooks/usePreload";
import {useAnimationVariants} from "./hooks/useAnimationVariants";
import {useVegasState} from "./hooks/useVegasState";
import {useAutoplay} from "./hooks/useAutoplay";
import {useVisibilityChange} from "./hooks/useVisibilityChange";


export const Vegas = React.forwardRef<{
	previous: () => void;
	next: () => void;
	play: () => void;
	pause: () => void;
} | null, VegasProps>((props, ref) => {
	const {
		slide = 0,
		delay = 5000,
		loop = true,
		preload = false,
		preloadImage = false,
		preLoadImageBatch = 3,
		preloadVideo = false,
		showLoading = false,
		timer = false,
		overlay = false,
		autoplay = true,
		shuffle = false,
		cover = true,
		color = null,
		align = "center",
		valign = "center",
		firstTransition = null,
		firstTransitionDuration = 3000,
		transition = "fade",
		transitionDuration = 1000,
		defaultBackground,
		defaultBackgroundDuration = 3000,
		debug = false,
		slides,
		onInit,
		onPlay,
		onPause,
		onWalk
	} = props;

	// 状态管理
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [showDefaultBg, setShowDefaultBg] = useState(true);

	// 日志函数
	const { log, logWarn, logError } = useLogger(debug);
	const containerRef = useRef<HTMLDivElement>(null);

	// 预加载资源
	const { loading, loadProgress, loadedImages, batchPreloadImages } =
		usePreload(slides, preloadImage, preloadVideo, preLoadImageBatch, log, logWarn, logError);

	// 动画变体配置
	const { variants } = useAnimationVariants(transitionDuration);

	// 幻灯片状态管理
	const vegasState = useVegasState(
		slide,
		slides,
		loop,
		shuffle,
		isTransitioning,
		firstTransition,
		firstTransitionDuration,
		log,
		onWalk
	);

	const {
		currentSlide,
		isPlaying,
		setIsPlaying,
		visibleSlides,
		isFirstTransition,
		setIsFirstTransition,
		play: statePlay,
		pause: statePause,
		next,
		previous,
	} = vegasState;

	// 播放控制函
	const play = useCallback(() => {
		statePlay();
		if (isFirstTransition && showDefaultBg) {
			logWarn("默认背景显示中，等待动画完成");
			setTimeout(() => {
				setShowDefaultBg(false);
				log("默认背景隐藏");
			}, transitionDuration);
			setIsFirstTransition(false);
		}
		onPlay?.();
	}, [statePlay, isFirstTransition, showDefaultBg, onPlay]);

	// 暂停控制函数
	const pause = useCallback(() => {
		statePause();
		onPause?.();
	}, [statePause, onPause]);

	// 自动播放逻辑
	useAutoplay(isPlaying, isTransitioning, currentSlide, slides, delay, next, log);

	// 页面可见性变化处理
	useVisibilityChange(play, pause, log);

	// 初始化
	useEffect(() => {
		log("Vegas组件开始初始化");

		// 预加载资源
		if (preload) {
			log("开始预加载资源");
			setIsPlaying(false);
			batchPreloadImages().then(() => {
				if (autoplay && !defaultBackground) {
					play();
				}
			});
		}

		onInit?.();

		const cleanup = () => {
			log("Vegas组件卸载");
			pause();
		};

		if (defaultBackground) {
			log(`存在默认背景，关闭自动播放`);
			setIsPlaying(false);
			log(`设置默认背景: ${defaultBackground}`);
			log(`设置默认背景显示定时器，延迟: ${defaultBackgroundDuration}ms`);
			const timer = window.setTimeout(() => {
				log("默认背景显示完成，开始自动播放");
				if (autoplay) {
					play();
				}
			}, defaultBackgroundDuration);
			return () => {
				clearTimeout(timer);
				cleanup();
			};
		} else if (autoplay) {
			play();
		}

		return cleanup;
	}, []);

	// 动画结束处理
	useEffect(() => {
		if (isTransitioning) {
			const timer = setTimeout(() => {
				setIsTransitioning(false);
				log("幻灯片切换动画完成");
			}, transitionDuration);
			return () => clearTimeout(timer);
		}
	}, [isTransitioning, transitionDuration]);

	// 渲染幻灯片
	const renderSlide = useCallback((index: number) => {
		try {
			const slide = slides[index];
			if (!slide) {
				logError(`幻灯片索引 ${index} 不存在`);
				return null;
			}

			return (
				<VegasSlideRenderer
					slide={slide}
					index={index}
					isFirstTransition={isFirstTransition}
					firstTransitionDuration={firstTransitionDuration}
					transitionDuration={transitionDuration}
					transition={transition}
					cover={cover}
					align={align}
					valign={valign}
					color={color}
					variants={variants}
					preloadImage={preloadImage}
					loadedImages={loadedImages}
					next={next}
					log={log}
					logError={logError}
				/>
			);
		} catch (error) {
			logError("渲染幻灯片时发生错误:", error);
			return null;
		}
	}, [next, variants, transition, color, cover, align, valign, isFirstTransition,
		firstTransitionDuration, transitionDuration]);

	// 暴露组件实例方法
	React.useImperativeHandle(ref, () => ({
		previous,
		next,
		play,
		pause
	}));

	// Props 验证
	if (slides.length === 0) {
		logError("幻灯片数组不能为空");
		return null;
	}

	if (transitionDuration <= 0) {
		logWarn("transitionDuration 应该大于 0");
	}

	// 渲染组件
	return (
		<div
			ref={containerRef}
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				overflow: "hidden",
				backgroundColor: color || undefined
			}}
		>
			{/* 默认背景图层 */}
			{defaultBackground && showDefaultBg && (
				<VegasDefaultBackground
					backgroundUrl={defaultBackground.toString()}
				/>
			)}

			{/* 渲染幻灯片 */}
			{isPlaying && (
				<VegasSlide
					visibleSlides={visibleSlides}
					renderSlide={renderSlide}
				/>
			)}

			{/* 遮罩层 */}
			{overlay && (
				<VegasOverlay/>
			)}

			{/* 进度条 */}
			{timer && isPlaying && (
				<VegasTimer
					currentOrderIndex={vegasState.currentOrderIndex} totalSlides={slides.length}
				/>
			)}

			{/* 加载指示器 */}
			{showLoading && loading && (
				<VegasLoader loadProgress={loadProgress}/>
			)}
		</div>
	);
});

Vegas.displayName = "Vegas";
