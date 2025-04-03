import React, {useEffect, useRef, useState, useCallback} from "react";
import {VegasProps} from "./types";
import {motion} from "motion/react";
import {VegasLoader} from "./components/VegasLoader";
import {VegasTimer} from "./components/VegasTimer";
import {VegasOverlay} from "./components/VegasOverlay";
import {VegasDefaultBackground} from "./components/VegasDefaultBackground";
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
			// 如果firstTransition存在，则修改第一个幻灯片的动画
			if (firstTransition) {
				log(`设置第一个幻灯片的动画: ${firstTransition}`);
				slides[order[0]].transition = firstTransition;
				slides[order[0]].transitionDuration = firstTransitionDuration;
			}
		} else {
			// 非随机排序，直接使用原始顺序
			setCurrentSlide(slide);
			setVisibleSlides([slide]);
			setCurrentOrderIndex(slide);
		}
		setSlideOrder(order);

		// 预加载资源
		if (preload) {
			log("开始预加载资源");
			setLoading(true);
			setIsPlaying(false);
			const preloadPromises: Promise<void>[] = [];

			if (preloadImage) {
				preloadPromises.push(batchPreloadImages());
			}
			if (preloadVideo) {
				slides.forEach(slide => {
					if (slide.video) {
						slide.video.src.forEach(src => {
							const link = document.createElement("link");
							link.rel = "preload";
							link.as = "video";
							link.href = src;
							document.head.appendChild(link);
							log(`预加载视频: ${src}`);
						});
					}
				});
			}

			Promise.all(preloadPromises)
			.then(() => {
				log("所有资源预加载完成");
				setLoading(false);
				if (autoplay && !defaultBackground) {
					play();
				}
			})
			.catch(error => {
				logError("预加载资源时发生错误:", error);
				setLoading(false);
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

			const currentTransition = slide.transition || transition;
			const style: React.CSSProperties = {
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				backgroundColor: slide.color || color || undefined,
				objectFit: slide.cover ?? cover ? "cover" : "contain",
				objectPosition: `${slide.align || align} ${slide.valign || valign}`
			};

			const currentTransitionDurationValue = isFirstTransition ?
				firstTransitionDuration : transitionDuration;

			const isImagePreloaded = preloadImage && loadedImages[slide.src];

			const content = slide.video ? (
				<video
					key={index}
					style={style}
					autoPlay
					muted={slide.video.muted}
					loop={slide.video.loop}
					onEnded={() => {
						if (!slide.video?.loop) {
							log("视频播放结束,切换到下一张");
							next();
						}
					}}
				>
					{slide.video.src.map((src, i) => (
						<source key={i} src={src}/>
					))}
				</video>
			) : (
				<div
					key={index}
					style={{
						...style,
						backgroundImage: `url(${slide.src})`,
						backgroundSize: slide.cover ?? cover ? "cover" : "contain",
						backgroundPosition: `${slide.align || align} ${slide.valign || valign}`,
						backgroundRepeat: "no-repeat"
					}}
					onLoad={!isImagePreloaded ? () => {
					} : undefined}
					onError={() => {
						logError(`图片加载失败: ${slide.src}`);
					}}
				/>
			);

			const variant = variants[currentTransition as keyof typeof variants] || variants.fade;

			log(`渲染幻灯片: ${slide.src}, 动画: ${currentTransition}, 持续时间: ${currentTransitionDurationValue}ms`);

			return (
				<motion.div
					key={slide.src}
					initial="exit"
					animate="enter"
					exit="exit"
					variants={
						currentTransition in variants
							? variant({duration: currentTransitionDurationValue / 1000})
							: variant({duration: transitionDuration / 1000})
					}
					style={{
						position: "absolute",
						width: "100%",
						height: "100%"
					}}
				>
					{content}
				</motion.div>
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
