import { useMemo } from 'react';

/**
 * 动画变体钩子
 * @param transitionDuration
 */
export const useAnimationVariants = (transitionDuration: number) => {
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

	return { variants };
};
