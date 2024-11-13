import { showNotify, showDialog } from 'vant';
import type { NotifyOptions } from 'vant';
import { useAuthStore } from '~/stores/auth';

// 错误类型定义
export interface AppError extends Error {
	code?: string | number;
	details?: any;
	httpStatus?: number;
}

// 错误处理配置
interface ErrorHandlerOptions {
	showNotification?: boolean;
	showDialog?: boolean;
	dialogTitle?: string;
	notifyOptions?: NotifyOptions;
}

// 默认配置
const defaultOptions: ErrorHandlerOptions = {
	showNotification: true,
	showDialog: false,
	dialogTitle: '错误提示',
	notifyOptions: {
		type: 'danger',
		duration: 3000,
		position: 'top'
	}
};

// 错误消息映射
const errorMessages: Record<string, string> = {
	NETWORK_ERROR: '网络连接失败，请检查网络设置',
	UNAUTHORIZED: '登录已过期，请重新登录',
	FORBIDDEN: '没有操作权限',
	NOT_FOUND: '请求的资源不存在',
	SERVER_ERROR: '服务器错误，请稍后重试',
	TIMEOUT: '请求超时，请重试',
	VALIDATION_ERROR: '输入数据验证失败',
	OFFLINE: '当前处于离线状态，请检查网络连接'
};

// 获取错误消息
export function getErrorMessage(error: AppError): string {
	if (typeof error === 'string') {
		return error;
	}

	// 优先使用错误代码映射
	if (error.code && errorMessages[error.code]) {
		return errorMessages[error.code];
	}

	// HTTP状态码处理
	if (error.httpStatus) {
		switch (error.httpStatus) {
			case 401:
				return errorMessages.UNAUTHORIZED;
			case 403:
				return errorMessages.FORBIDDEN;
			case 404:
				return errorMessages.NOT_FOUND;
			case 500:
				return errorMessages.SERVER_ERROR;
			default:
				return error.message || '未知错误';
		}
	}

	return error.message || '发生未知错误';
}

// 全局错误处理函数
export function handleError(
	error: AppError,
	options: ErrorHandlerOptions = {}
) {
	const finalOptions = { ...defaultOptions, ...options };
	const errorMessage = getErrorMessage(error);

	// 控制台输出错误信息
	console.error('[App Error]:', {
		message: errorMessage,
		code: error.code,
		details: error.details,
		stack: error.stack
	});

	// 显示通知
	if (finalOptions.showNotification) {
		showNotify({
			...finalOptions.notifyOptions,
			message: errorMessage
		});
	}

	// 显示对话框
	if (finalOptions.showDialog) {
		showDialog({
			title: finalOptions.dialogTitle,
			message: errorMessage,
			theme: 'round-button',
			confirmButtonText: '知道了',
			confirmButtonColor: 'var(--van-primary-color)'
		});
	}

	// 特殊错误处理
	if (error.code === 'UNAUTHORIZED') {
		// 处理登录过期
		const router = useRouter();
		const authStore = useAuthStore();
		authStore.logout();
		router.push('/login');
	}
}
