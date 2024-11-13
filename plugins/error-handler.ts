import { handleError, type AppError } from '~/utils/error';

export default defineNuxtPlugin((nuxtApp) => {
	// Vue错误处理
	nuxtApp.vueApp.config.errorHandler = (error: unknown, instance, info) => {
		console.error('[Vue Error]:', error);
		console.error('Component:', instance);
		console.error('Error Info:', info);

		handleError(error as AppError, {
			showNotification: true
		});
	};

	// 全局Promise错误处理
	window.addEventListener('unhandledrejection', (event) => {
		console.error('[Unhandled Promise Rejection]:', event.reason);

		handleError(event.reason as AppError, {
			showNotification: true
		});
	});

	// 全局错误处理
	window.addEventListener('error', (event) => {
		console.error('[Global Error]:', event.error);

		handleError(event.error as AppError, {
			showNotification: true
		});
	});

	// 提供全局错误处理方法
	return {
		provide: {
			handleError: (error: AppError, options = {}) =>
				handleError(error, options)
		}
	};
});
