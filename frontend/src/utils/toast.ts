type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

/**
 * トースト通知の表示時間定数（ミリ秒）
 */
export const TOAST_DURATION = {
    /** 短いメッセージ（成功通知など） */
    SHORT: 2000,
    /** 中程度のメッセージ（デフォルト） */
    MEDIUM: 2500,
    /** 長いメッセージ（エラーなど） */
    LONG: 3000,
    /** 非常に長いメッセージ（ネットワークエラーなど） */
    VERY_LONG: 4000,
} as const;

const getToastStyles = (type: ToastType) => {
    switch (type) {
        case 'success':
            return {
                bg: 'bg-green-500',
                icon: '✓',
                shadow: 'shadow-green-200',
            };
        case 'error':
            return {
                bg: 'bg-red-500',
                icon: '✕',
                shadow: 'shadow-red-200',
            };
        case 'warning':
            return {
                bg: 'bg-yellow-500',
                icon: '⚠',
                shadow: 'shadow-yellow-200',
            };
        case 'info':
        default:
            return {
                bg: 'bg-blue-500',
                icon: 'ℹ',
                shadow: 'shadow-blue-200',
            };
    }
};

export const showToast = ({ message, type = 'info', duration = TOAST_DURATION.MEDIUM }: ToastOptions) => {
    const styles = getToastStyles(type);

    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${styles.bg} text-white px-6 py-3 rounded-full shadow-lg ${styles.shadow} flex items-center gap-3 z-50 animate-bounce-in`;

    toast.innerHTML = `
    <span class="text-2xl">${styles.icon}</span>
    <span class="font-medium">${message}</span>
  `;

    // アニメーション用のスタイルを追加
    const style = document.createElement('style');
    style.textContent = `
    @keyframes bounce-in {
      0% {
        transform: translate(-50%, -100px);
        opacity: 0;
      }
      50% {
        transform: translate(-50%, 10px);
      }
      100% {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }
    @keyframes fade-out {
      0% {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -20px) scale(0.9);
      }
    }
    .animate-bounce-in {
      animation: bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    .animate-fade-out {
      animation: fade-out 0.3s ease-out forwards;
    }
  `;

    if (!document.querySelector('#toast-styles')) {
        style.id = 'toast-styles';
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // 指定時間後にフェードアウト
    setTimeout(() => {
        toast.classList.remove('animate-bounce-in');
        toast.classList.add('animate-fade-out');

        // フェードアウトアニメーション完了後に削除
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
};

// 便利な関数
export const toast = {
    success: (message: string, duration?: number) =>
        showToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) =>
        showToast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) =>
        showToast({ message, type: 'info', duration }),
    warning: (message: string, duration?: number) =>
        showToast({ message, type: 'warning', duration }),
};
