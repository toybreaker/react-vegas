import React, {useEffect, useRef, useState, useCallback, useMemo} from "react";
import {motion, AnimatePresence} from "motion/react";

// Vegas组件的Props类型定义
interface VegasProps {
	slide?: number;                   // 初始幻灯片索引
	delay?: number;                   // 切换延迟时间(毫秒)
	loop?: boolean;                   // 是否循环播放
	preload?: boolean;                // 是否预加载资源
	preloadImage?: boolean;           // 是否预加载图片
	preLoadImageBatch?: number;       // 批量预加载图片数量
	preloadVideo?: boolean;           // 是否预加载视频
	showLoading?: boolean;            // 是否显示加载指示器
	timer?: boolean;                  // 是否显示计时器
	overlay?: boolean;                // 是否显示遮罩层
	autoplay?: boolean;               // 是否自动播放
	shuffle?: boolean;                // 是否随机播放
	cover?: boolean;                  // 是否覆盖整个容器
	color?: string | null;            // 背景颜色
	align?: "left" | "center" | "right"; // 水平对齐方式
	valign?: "top" | "center" | "bottom"; // 垂直对齐方式
	firstTransition?: string | null;      // 第一次切换动画
	firstTransitionDuration?: number;     // 第一次切换动画持续时间
	transition?: string;                  // 切换动画类型
	transitionDuration?: number;          // 切换动画持续时间
	transitionRegister?: string[];        // 自定义切换动画注册
	animation?: string | null;            // 幻灯片动画类型
	animationRegister?: string[];         // 自定义幻灯片动画注册
	slidesToKeep?: number;                // 保持的幻灯片数量
	defaultBackground?: string | object;   // 默认背景图
	defaultBackgroundDuration?: number;    // 默认背景图与第一张幻灯片间隔时间
	debug?: boolean;                      // 是否启用日志
	slides: Array<{
		src: string;                      // 图片/视频源地址
		color?: string | null;            // 幻灯片背景色
		delay?: number | null;            // 当前幻灯片延迟时间
		align?: "left" | "center" | "right"; // 当前幻灯片水平对齐
		valign?: "top" | "center" | "bottom"; // 当前幻灯片垂直对齐
		transition?: string | null;        // 当前幻灯片切换动画
		transitionDuration?: number | null; // 当前幻灯片切换动画持续时间
		cover?: boolean;                   // 当前幻灯片是否覆盖
		video?: {
			src: string[];                 // 视频源地址数组
			muted?: boolean;               // 是否静音
			loop?: boolean;                // 是否循环播放
		};
	}>;
	onInit?: () => void;                  // 初始化回调
	onPlay?: () => void;                  // 播放回调
	onPause?: () => void;                 // 暂停回调
	onWalk?: () => void;                  // 切换回调
}

type Logger = (message: string, ...args: unknown[]) => void;

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
		timer = true,
		showLoading = false,
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

	// 日志工具函数
	const createLogger = (type: 'log' | 'error' | 'warn'): Logger =>
		debug ? console[type].bind(console) : () => {
		};

	const log = createLogger('log');
	const logError = createLogger('error');
	const logWarn = createLogger('warn');

	// 状态管理
	const [currentSlide, setCurrentSlide] = useState(slide);
	const [isPlaying, setIsPlaying] = useState(autoplay);
	const [, setSlideOrder] = useState<number[]>([]);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [visibleSlides, setVisibleSlides] = useState([slide]);
	const [loading, setLoading] = useState(true);
	const [showDefaultBg, setShowDefaultBg] = useState(true);
	const [isFirstTransition, setIsFirstTransition] = useState(true);
	const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
	const [loadProgress, setLoadProgress] = useState(0);

	const containerRef = useRef<HTMLDivElement>(null);

	// 动画变体配置
	const variants = useMemo(() => ({
		fade: (custom: { duration: number }) => ({
			enter: {opacity: 1, transition: {duration: custom.duration}},
			exit: {opacity: 0, transition: {duration: transitionDuration / 1000}}
		}),
		slideLeft: (custom: { duration: number }) => ({
			enter: {
				x: 0,
				opacity: 1,
				transition: {duration: custom.duration}
			},
			exit: {
				x: "-100%",
				opacity: 0,
				transition: {duration: transitionDuration / 1000}
			}
		}),
		slideRight: (custom: { duration: number }) => ({
			enter: {
				x: 0,
				opacity: 1,
				transition: {duration: custom.duration}
			},
			exit: {
				x: "100%",
				opacity: 0,
				transition: {duration: transitionDuration / 1000}
			}
		}),
		zoomIn: (custom: { duration: number }) => ({
			enter: {
				scale: 1,
				opacity: 1,
				transition: {duration: custom.duration}
			},
			exit: {
				scale: 0.5,
				opacity: 0,
				transition: {duration: transitionDuration / 1000}
			}
		}),
		zoomOut: (custom: { duration: number }) => ({
			enter: {
				scale: 1,
				opacity: 1,
				transition: {duration: custom.duration}
			},
			exit: {
				scale: 1.25,
				opacity: 0,
				transition: {duration: transitionDuration / 1000}
			}
		}),
		zoomInOut: (custom: { duration: number }) => ({
			enter: {
				scale: 1.25,
				opacity: 1,
				transition: {duration: custom.duration}
			},
			exit: {
				scale: 1,
				opacity: 0,
				transition: {duration: transitionDuration / 1000}
			}
		})
	}), [transitionDuration]);

	// 播放控制函数
	const play = useCallback(() => {
		log("开始播放幻灯片");
		setIsPlaying(true);
		onPlay?.();
	}, [onPlay]);

	const pause = useCallback(() => {
		log("暂停播放幻灯片");
		setIsPlaying(false);
		onPause?.();
	}, [onPause]);

	// 切换到指定幻灯片
	const goTo = useCallback((index: number) => {
		if (index >= 0 && index < slides.length && !isTransitioning) {
			log(`切换到幻灯片: ${index}`);
			setIsTransitioning(true);
			setVisibleSlides([index]);
			setCurrentSlide(index);
			onWalk?.();

			setTimeout(() => {
				setIsTransitioning(false);
				log("幻灯片切换动画完成");
			}, transitionDuration);
		}
	}, [slides.length, isTransitioning, transitionDuration, onWalk]);

	// 切换控制函数
	const next = useCallback(() => {
		setIsFirstTransition(false);
		if (isTransitioning) {
			log("正在切换中,跳过本次切换");
			return;
		}

		let nextSlide = currentSlide + 1;
		if (nextSlide >= slides.length) {
			if (loop) {
				nextSlide = 0;
				log("到达最后一张,循环回到第一张");
			} else {
				log("到达最后一张,停止播放");
				pause();
				return;
			}
		}
		goTo(nextSlide);
	}, [currentSlide, isTransitioning, slides.length, loop, goTo, pause]);

	const previous = useCallback(() => {
		if (isTransitioning) {
			log("正在切换中,跳过本次切换");
			return;
		}

		let prevSlide = currentSlide - 1;
		if (prevSlide < 0) {
			if (loop) {
				prevSlide = slides.length - 1;
				log("到达第一张,循环到最后一张");
			} else {
				log("到达第一张,停止播放");
				pause();
				return;
			}
		}
		goTo(prevSlide);
	}, [currentSlide, isTransitioning, slides.length, loop, goTo, pause]);

	// 初始化
	useEffect(() => {
		log("Vegas组件开始初始化");

		const order = Array.from({length: slides.length}, (_, i) => i);
		if (shuffle) {
			for (let i = order.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[order[i], order[j]] = [order[j], order[i]];
			}
			setCurrentSlide(order[0]);
			setVisibleSlides([order[0]]);
			log("幻灯片随机排序完成:", order);
			// 如果firstTransition存在，则修改第一个幻灯片的动画
			if (firstTransition) {
				log(`设置第一个幻灯片的动画: ${firstTransition}`);
				slides[order[0]].transition = firstTransition;
				slides[order[0]].transitionDuration = firstTransitionDuration;
			}
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

	// 自动播放定时器
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

	// 页面可见性变化处理
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

	// 批量预加载图片
	const batchPreloadImages = useCallback(async () => {
		if (!preloadImage) return;

		const batchSize = preLoadImageBatch;
		const imageSlides = slides.filter(slide => !slide.video);

		for (let i = 0; i < imageSlides.length; i += batchSize) {
			const batch = imageSlides.slice(i, i + batchSize);
			const promises = batch.map(slide => {
				return new Promise<void>((resolve) => {
					const img = new Image();
					img.onload = () => {
						setLoadedImages(prev => ({...prev, [slide.src]: true}));
						resolve();
					};
					img.onerror = () => {
						logWarn(`图片加载失败: ${slide.src}`);
						resolve();
					};
					img.src = slide.src;
				});
			});

			await Promise.all(promises);
			setLoadProgress(Math.min(100, Math.floor(((i + batch.length) / imageSlides.length) * 100)));
		}
	}, [slides, preloadImage]);

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

			const handleLoad = () => {
				log(`内容加载完成: ${slide.src}`);
				setLoading(false);
				setTimeout(() => {
					setShowDefaultBg(false);
				}, currentTransitionDurationValue);
			};

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
					onLoad={!isImagePreloaded ? handleLoad : undefined}  // 如果已预加载则不需要处理加载事件
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
				<motion.div
					initial={{opacity: 1}}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						backgroundImage: `url(${defaultBackground})`,
						backgroundSize: "cover",
						backgroundPosition: "center",
						zIndex: 0
					}}
				/>
			)}

			{/* 渲染幻灯片 */}
			{isPlaying && (
				<AnimatePresence mode="sync">
					{visibleSlides.map(index => renderSlide(index))}
				</AnimatePresence>
			)}

			{/* 遮罩层 */}
			{overlay && (
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						background: "rgba(0,0,0,0.3)"
					}}
				/>
			)}

			{/* 进度条 */}
			{timer && (
				<div
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						height: "3px",
						background: "#fff",
						width: slides.length > 1
							? `${(currentSlide / (slides.length - 1)) * 100}%`
							: "100%",
						transition: "width 0.5s linear"
					}}
				/>
			)}

			{/* 加载指示器 */}
			{showLoading && loading && (
				<div style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					textAlign: "center",
					color: "#fff",
					zIndex: 10,
					backgroundColor: "rgba(0,0,0,0.5)",
					padding: "20px",
					borderRadius: "8px"
				}}>
					<div>加载中... {loadProgress}%</div>
					<div style={{
						width: "200px",
						height: "5px",
						backgroundColor: "rgba(255,255,255,0.3)",
						marginTop: "10px"
					}}>
						<div style={{
							width: `${loadProgress}%`,
							height: "100%",
							backgroundColor: "#fff",
							transition: "width 0.3s"
						}}></div>
					</div>
				</div>
			)}
		</div>
	);
});

Vegas.displayName = "Vegas";
