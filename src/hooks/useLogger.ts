import {useCallback} from "react";
import {Logger} from "../types";

/**
 * 自定义日志钩子
 * @param debug
 */
export const useLogger = (debug: boolean) => {
	const createLogger = useCallback((type: 'log' | 'error' | 'warn'): Logger =>
		debug ? console[type].bind(console) : () => {
		}, [debug]);

	const log = createLogger('log');
	const logError = createLogger('error');
	const logWarn = createLogger('warn');

	return {log, logError, logWarn};
};
