import {Vegas} from "../src/index.js";

const meta = {
	title: 'Vegas Slides',
	component: Vegas,
	decorators: [
		(Story) => (
			<div style={{height: '100vh'}}>
				<Story/>
			</div>
		),
	],
	parameters: {
		layout: 'fullscreen',
	}
};

// 使用外链图片
const p1 = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb';
const p2 = 'https://images.unsplash.com/photo-1741986947217-d1a0ecc39149';
const p3 = 'https://cdn.pixabay.com/photo/2023/12/24/16/43/autumn-8467482_1280.jpg';
const p4 = 'https://cdn.pixabay.com/photo/2024/05/21/21/46/bird-8779199_1280.jpg';
const p5 = 'https://cdn.pixabay.com/photo/2021/03/13/21/54/planet-6092940_1280.jpg';
const p6 = 'https://cdn.pixabay.com/photo/2023/08/31/14/40/mountain-8225287_1280.jpg';
const background = 'https://images.unsplash.com/photo-1742560897614-69c3f47771be';

export default meta;

const slides = [
	{
		src: p1,
		transition: 'fade',
	},
	{
		src: p2,
		transition: 'slideLeft',
	},
	{
		src: p3,
		transition: 'slideRight',
	},
	{
		src: p4,
		transition: 'zoomIn',
	},
	{
		src: p5,
		transition: 'zoomOut',
	},
	{
		src: p6,
		transition: 'zoomInOut',
	}
];
export const Default = {
	args: {
		slides: slides,
		// 自动播放
		autoplay: true,
		// 遮罩层
		overlay: true,
		// 每张幻灯片的显示时间
		delay: 7000,
		// 随机顺序
		shuffle: true,
		// 切换动画持续时间
		transitionDuration: 3000,
		// 第一次切换幻灯片的动画
		firstTransition: 'fade',
		// 第一次切换动画持续时间
		firstTransitionDuration: 5000,
		// 背景图片
		defaultBackground: background,
		// 默认背景显示时间
		defaultBackgroundDuration: 3000,
		// 背景颜色
		color: '#000',
		// 启用预加载
		preload: true,
		// 预加载图片
		preloadImage: true,
		// 预加载视频
		preloadVideo: false,
		// 播放进度条
		timer: true,
		// 加载指示器
		showLoading: true,
		// 打印调试信息
		debug: true
	}
};
