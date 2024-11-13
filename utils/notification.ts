import { showNotify, showToast, showDialog } from 'vant';
import type { NotifyOptions, ToastOptions, DialogOptions } from 'vant';

// 成功提示
export function showSuccess(message: string, options: ToastOptions = {}) {
	return showToast({
		message,
		type: 'success',
		duration: 2000,
		position: 'top',
		...options
	});
}

// 错误提示
export function showErrorMsg(message: string, options: NotifyOptions = {}) {
	return showNotify({
		message,
		type: 'danger',
		duration: 3000,
		position: 'top',
		...options
	});
}

// 警告提示
export function showWarning(message: string, options: NotifyOptions = {}) {
	return showNotify({
		message,
		type: 'warning',
		duration: 3000,
		position: 'top',
		...options
	});
}

// 确认对话框
export function showConfirm(options: DialogOptions) {
	return showDialog({
		theme: 'round-button',
		confirmButtonColor: 'var(--van-primary-color)',
		cancelButtonText: '取消',
		confirmButtonText: '确定',
		...options
	});
}

// 加载提示
export function showLoading(message = '加载中...', options: ToastOptions = {}) {
	return showToast({
		message,
		type: 'loading',
		duration: 0,
		forbidClick: true,
		...options
	});
}
