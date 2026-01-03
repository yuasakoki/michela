/**
 * メッセージテンプレート定義
 * 共通のメッセージパターンをテンプレート関数として管理
 */

/**
 * 成功メッセージのテンプレート
 */
export const SUCCESS_MESSAGES = {
    /** 登録成功: "〇〇を登録しました✨" */
    REGISTERED: (target: string) => `${target}を登録しました✨`,

    /** 削除成功: "〇〇を削除しました✨" (削除しました) */
    DELETED: (target?: string) => target ? `${target}を削除しました✨` : '削除しました✨',

    /** 更新成功: "〇〇を更新しました✨" */
    UPDATED: (target: string) => `${target}を更新しました✨`,

    /** 設定成功: "〇〇を設定しました✨" */
    CONFIGURED: (target: string) => `${target}を設定しました✨`,
} as const;

/**
 * エラーメッセージのテンプレート
 */
export const ERROR_MESSAGES = {
    /** 登録失敗: "〇〇の登録に失敗しました" or "〇〇の登録に失敗: 理由" */
    REGISTRATION_FAILED: (target: string, reason?: string) =>
        reason ? `${target}の登録に失敗: ${reason}` : `${target}の登録に失敗しました`,

    /** 削除失敗: "〇〇の削除に失敗しました" or "削除に失敗しました" */
    DELETION_FAILED: (target?: string, reason?: string) => {
        if (reason) return `${target ? `${target}の` : ''}削除に失敗: ${reason}`;
        return target ? `${target}の削除に失敗しました` : '削除に失敗しました';
    },

    /** 更新失敗: "〇〇の更新に失敗しました" */
    UPDATE_FAILED: (target: string, reason?: string) =>
        reason ? `${target}の更新に失敗: ${reason}` : `${target}の更新に失敗しました`,

    /** 設定失敗: "〇〇の設定に失敗しました" */
    CONFIGURATION_FAILED: (target: string, reason?: string) =>
        reason ? `${target}の設定に失敗: ${reason}` : `${target}の設定に失敗しました`,

    /** 取得失敗: "〇〇の取得に失敗しました" */
    FETCH_FAILED: (target: string, reason?: string) =>
        reason ? `${target}の取得に失敗: ${reason}` : `${target}の取得に失敗しました`,
} as const;

/**
 * 警告メッセージのテンプレート
 */
export const WARNING_MESSAGES = {
    /** 必須項目未入力: "〇〇を入力してください" */
    REQUIRED_FIELD: (field: string) => `${field}を入力してください`,

    /** 選択必須: "〇〇を選択してください" */
    REQUIRED_SELECTION: (field: string) => `${field}を選択してください`,

    /** 最低数未達: "少なくとも〇〇を追加してください" */
    MINIMUM_REQUIRED: (target: string, count: number = 1) =>
        `少なくとも${count > 1 ? count : ''}${count > 1 ? '個の' : ''}${target}を追加してください`,

    /** 変更なし: "〇〇が変更されていません" */
    NO_CHANGE: (target: string) => `${target}が変更されていません`,
} as const;

/**
 * 対象オブジェクトの日本語名
 */
export const TARGET_NAMES = {
    CUSTOMER: '顧客',
    TRAINING_SESSION: 'トレーニング記録',
    TRAINING_EXERCISE: '種目',
    MEAL_RECORD: '食事記録',
    NUTRITION_GOAL: '栄養目標',
    WEIGHT: '体重',
    ADVICE: 'アドバイス',
    RESEARCH: '最新研究',
} as const;
