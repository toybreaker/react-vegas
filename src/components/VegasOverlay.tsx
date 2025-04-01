import {FC} from "react";

/**
 * 遮罩层组件
 * @constructor
 */
export const VegasOverlay: FC = () => {
	return (
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
	);
};
