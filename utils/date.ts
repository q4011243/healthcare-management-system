import dayjs from 'dayjs';

export default () => {
  return 'Hello Util';
};

export const formatTime = (date: Date | undefined) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatDate = (
  date: Date | undefined,
  format: string = 'YYYY-MM-DD'
) => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateCN = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
