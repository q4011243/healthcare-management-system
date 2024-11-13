import type { AppError } from '~/utils/error';

export function useHttp() {
	const { $handleError } = useNuxtApp();

	const request = async <T>(config: any): Promise<T> => {
		try {
			const response = await $fetch<T>(config.url, {
				...config,
				onResponseError: (error) => {
					throw {
						message: error.response?._data?.message || '请求失败',
						code: error.response?.status,
						details: error.response?._data,
						httpStatus: error.response?.status
					} as AppError;
				}
			});

			return response;
		} catch (error) {
			$handleError(error as AppError);
			throw error;
		}
	};

	return {
		request
	};
}
