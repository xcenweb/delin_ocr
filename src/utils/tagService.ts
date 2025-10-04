/** 标签配置接口 */
interface TagConfig {
    id: string;
    keywords: readonly string[];
}

// 统一的标签配置（设为只读，防止意外修改）
export const BASE_TAGS: readonly TagConfig[] = [
    { id: 'identity_card', keywords: ['居民身份证', '身份证', '公民身份', 'ID Card', 'Identity Card'] },
    { id: 'driver_license', keywords: ['驾驶证', '机动车驾驶证', 'Driver License', 'Driving License'] },
    { id: 'passport', keywords: ['护照', 'Passport', 'PASSPORT', '中华人民共和国护照'] },
    { id: 'business_license', keywords: ['营业执照', '工商营业执照', 'Business License', '统一社会信用代码'] },
    { id: 'residence_permit', keywords: ['居住证', '暂住证', 'Residence Permit'] },
    { id: 'student_id', keywords: ['学生证', 'Student ID', '学生卡'] },
    { id: 'bank_card', keywords: ['银行卡', '储蓄卡', '信用卡', 'Bank Card', 'Credit Card', 'Debit Card'] },
    { id: 'social_security_card', keywords: ['社保卡', '社会保障卡', 'Social Security Card'] },
    { id: 'medical_insurance_card', keywords: ['医保卡', '医疗保险卡', 'Medical Insurance Card'] },
    { id: 'contract', keywords: ['合同', '协议', 'Contract', 'Agreement', '合作协议', '服务合同'] },
    { id: 'report', keywords: ['报告', '分析报告', 'Report', '调研报告', '工作报告', '研究报告'] },
    { id: 'notice', keywords: ['公告', '通知', 'Notice', '声明', '公示'] },
    { id: 'resume', keywords: ['简历', '履历', 'Resume', 'CV', '个人简历'] },
    { id: 'transcript', keywords: ['成绩单', 'Transcript', '学习成绩', '考试成绩'] },
    { id: 'certificate', keywords: ['证书', '资格证', '认证证书', 'Certificate', '培训证书', '专业证书', '技能证书', '职业资格', '等级证书'] },
    { id: 'invoice', keywords: ['发票', '增值税发票', '普通发票', '电子发票', 'Invoice', '税务发票', '收据', '付款凭证'] },
    { id: 'form', keywords: ['申请表', '登记表', '登记单', '申请书', '表格', 'Form', 'Application Form', '登记册', '填表'] },
    { id: 'document', keywords: ['文档', '文件', 'Document', 'File', 'Word'] },
    { id: 'other', keywords: [] }
];

/**
 * 分类引擎
 */
class ClassEngine {
    /** 文本标准化：小写、去空格、去标点和零宽字符 */
    static normalizeText(text: string): string {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[\p{P}\p{S}]/gu, '') // Unicode标点和符号
            .replace(/[\u200B-\u200F\uFEFF]/g, '');
    }

    /** 顺序字符匹配（允许插入干扰字符） */
    static containsCharSequence(text: string, keyword: string): boolean {
        if (!keyword) return true;
        let i = 0, j = 0;
        while (i < text.length && j < keyword.length) {
            if (text[i] === keyword[j]) j++;
            i++;
        }
        return j === keyword.length;
    }

    /** Levenshtein距离（编辑距离） */
    static editDistance(a: string, b: string): number {
        const m = a.length, n = b.length;
        if (m === 0) return n;
        if (n === 0) return m;
        const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
            }
        }
        return dp[m][n];
    }

    /** 字符串相似度（0-1） */
    static similarity(a: string, b: string): number {
        if (a === b) return 1;
        if (!a.length || !b.length) return 0;
        const dist = ClassEngine.editDistance(a, b);
        return 1 - dist / Math.max(a.length, b.length);
    }

    /** 关键词匹配（精确、顺序、模糊、滑窗），返回匹配详情 */
    static checkKeywords(text: string, keywords: readonly string[], threshold = 0.7): Array<{ keyword: string; score: number; type: 'exact' | 'sequence' | 'fuzzy' | 'window' }> {
        if (!keywords.length) return [];
        const normalizedText = ClassEngine.normalizeText(text);
        const results: Array<{ keyword: string; score: number; type: 'exact' | 'sequence' | 'fuzzy' | 'window' }> = [];

        for (const keyword of keywords) {
            const normKey = ClassEngine.normalizeText(keyword);
            if (!normKey) continue;

            // 精确匹配（最高分）
            if (normalizedText.includes(normKey)) {
                results.push({ keyword, score: 1.0, type: 'exact' });
                continue;
            }

            // 顺序匹配（次高分）
            if (ClassEngine.containsCharSequence(normalizedText, normKey)) {
                results.push({ keyword, score: 0.8, type: 'sequence' });
                continue;
            }

            if (normKey.length < 2) continue;

            // 全局模糊匹配
            if (normKey.length >= 4) {
                const sim = ClassEngine.similarity(normalizedText, normKey);
                if (sim >= threshold) {
                    results.push({ keyword, score: 0.6 * sim, type: 'fuzzy' });
                    continue;
                }
            }

            // 滑窗模糊匹配（最低分）
            const win = normKey.length;
            if (win <= normalizedText.length) {
                let maxSim = 0;
                for (let i = 0; i <= normalizedText.length - win; i++) {
                    const sim = ClassEngine.similarity(normalizedText.slice(i, i + win), normKey);
                    if (sim >= threshold && sim > maxSim) {
                        maxSim = sim;
                    }
                }
                if (maxSim > 0) {
                    results.push({ keyword, score: 0.4 * maxSim, type: 'window' });
                }
            }
        }

        return results;
    }
}

/**
 * 标签服务类 - 处理标签生成和管理
 */
class TagService {
    private allTags: string[] = BASE_TAGS.map(c => c.id);

    /**
     * 根据OCR文本生成标签，使用加权评分系统
     * @param text OCR识别的文本内容
     * @param defaultTags 默认标签，当没有匹配时返回
     * @param maxLength 最大返回标签数量，默认为3
     * @returns 标签ID数组
     */
    generateTags(text: string, defaultTags: string[] = ['other'], maxLength: number = 3): string[] {
        if (!text?.trim()) return defaultTags;

        // 计算每个标签配置的匹配分数
        const scores: [string, number][] = BASE_TAGS
            .filter(cfg => cfg.keywords.length)
            .map(cfg => {
                const matches = ClassEngine.checkKeywords(text, cfg.keywords);
                if (matches.length === 0) return [cfg.id, 0] as [string, number];

                // 计算加权分数
                const weightedScore = matches.reduce((sum, match) => {
                    // 基础分数（由匹配类型决定）已包含在match.score中
                    // 附加权重因素：
                    const keywordLengthBonus = Math.min(match.keyword.length / 10, 1) * 0.2; // 关键词长度奖励
                    const matchTypeBonus = match.type === 'exact' ? 0.3 : 0; // 精确匹配额外奖励
                    return sum + match.score + keywordLengthBonus + matchTypeBonus;
                }, 0);

                // 计算平均分数（考虑匹配数量）
                const averageScore = weightedScore / matches.length;
                // 最终分数结合总分和平均分
                const finalScore = (weightedScore * 0.7) + (averageScore * 0.3);

                return [cfg.id, finalScore] as [string, number];
            })
            .filter(([, score]) => score > 0);

        // 按最终得分降序排序
        scores.sort((a, b) => b[1] - a[1]);

        // 限制返回标签数量
        const limitedScores = scores.slice(0, maxLength);
        return limitedScores.length ? limitedScores.map(([id]) => id) : defaultTags;
    }
}

export const tagService = new TagService();