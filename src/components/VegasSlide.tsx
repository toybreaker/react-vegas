import {FC, Fragment, ReactNode} from "react";
import {AnimatePresence} from "motion/react";

interface VegasSlideProps {
	visibleSlides: number[];
	renderSlide: (index: number) => ReactNode;
}

/**
 * 动画幻灯片组件
 * @param visibleSlides
 * @param renderSlide
 * @constructor
 */
export const VegasSlide: FC<VegasSlideProps> = ({
	                                                visibleSlides,
	                                                renderSlide
                                                }) => {
	return (
		<AnimatePresence mode="sync" presenceAffectsLayout={false}>
			{visibleSlides.map(index => (
				<Fragment key={`slide-${index}`}>
					{renderSlide(index)}
				</Fragment>
			))}
		</AnimatePresence>
	);
};
