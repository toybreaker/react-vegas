import {FC} from "react";

interface VegasTimerProps {
	currentOrderIndex: number;
	totalSlides: number;
}

/**
 * 幻灯片进度指示器组件
 * @param currentOrderIndex
 * @param totalSlides
 * @constructor
 */
export const VegasTimer: FC<VegasTimerProps> = ({
	                                                currentOrderIndex,
	                                                totalSlides
                                                }) => {
	return (
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				height: "3px",
				background: "#fff",
				width: totalSlides > 1
					? `${(currentOrderIndex / (totalSlides - 1)) * 100}%`
					: "100%",
				transition: "width 0.5s linear"
			}}
		/>
	);
};
