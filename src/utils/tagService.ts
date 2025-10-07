/** 标签配置接口 */
interface TagConfig {
    id: string;
    keywords: readonly string[];
}

// 统一的标签配置（设为只读，防止意外修改）
export const BASE_TAGS: readonly TagConfig[] = [
    { id: 'identity_card', keywords: ['居民身份证', '身份证', '公民身份', 'ID Card', 'Identity Card'] },
    { id: 'passport', keywords: ['护照', 'Passport', 'PASSPORT', '中华人民共和国护照'] },
    { id: 'business_license', keywords: ['营业执照', '工商营业执照', 'Business License', '统一社会信用代码'] },
    { id: 'student_id', keywords: ['学生证', 'Student ID', '学生卡'] },
    { id: 'bank_card', keywords: ['银行卡', '储蓄卡', '信用卡', 'Bank Card', 'Credit Card', 'Debit Card'] },
    { id: 'contract', keywords: ['合同', '协议', 'Contract', 'Agreement', '合作协议', '服务合同'] },
    { id: 'report', keywords: ['报告', '分析报告', 'Report', '调研报告', '工作报告', '研究报告'] },
    { id: 'notice', keywords: ['公告', '通知', 'Notice', '声明', '公示'] },
    { id: 'resume', keywords: ['简历', '履历', 'Resume', 'CV', '个人简历'] },
    { id: 'transcript', keywords: ['成绩单', 'Transcript', '学习成绩', '考试成绩'] },
    { id: 'invoice', keywords: ['发票', '增值税发票', '普通发票', '电子发票', 'Invoice', '税务发票', '收据', '付款凭证'] },
    { id: 'document', keywords: ['文档', '文件', 'Document', 'File', 'Word'] },
    { id: 'vocational', keywords: ['学历证书', '学位证书', '学历', '学位', 'Certificate', 'Degree'] },
    { id: 'professional', keywords: ['专业证书', '专业资格', 'License', 'Certification'] },
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

    /**
     * 查找文本中与关键词列表的最佳匹配项
     * @param text 待匹配的文本
     * @param keywords 关键词列表
     * @param threshold 相似度阈值
     * @returns 返回得分最高的匹配项，如果没有则返回 null
     */
    static findBestMatch(text: string, keywords: readonly string[], threshold = 0.7): { keyword: string; score: number; type: 'exact' | 'sequence' | 'fuzzy' | 'window' } | null {
        const allMatches = ClassEngine.checkKeywords(text, keywords, threshold);
        if (allMatches.length === 0) return null;
        // 找到得分最高的匹配
        return allMatches.reduce((best, current) => (current.score > best.score ? current : best));
    }
}

/**
 * 标签服务类 - 处理标签生成和管理
 */
class TagService {
    private allTags: string[] = BASE_TAGS.map(c => c.id);

    /**
     * 将长文本切分为更小的块
     * @param text 原始文本
     * @param maxChunkLength 如果无法按句子切分，则按此最大长度切分
     * @returns 文本块数组
     */
    private chunkText(text: string, maxChunkLength: number = 500): string[] {
        // 策略1: 优先按句子分割，保留上下文
        // 使用正则匹配句子，保留句子结尾的标点
        const sentences = text.match(/[^。！？.!?]+[。！？.!?]+/g);
        if (sentences && sentences.length > 1) {
            // 过滤掉太短的句子，它们通常是噪音
            return sentences.filter(s => s.trim().length > 10);
        }

        // 策略2: 如果没有明显的句子分隔符（如列表、地址），则按固定长度分割
        const chunks = [];
        for (let i = 0; i < text.length; i += maxChunkLength) {
            chunks.push(text.slice(i, i + maxChunkLength));
        }
        return chunks.length > 0 ? chunks : [text];
    }

    /**
     * 根据OCR文本生成标签，使用分块和最佳匹配聚合策略
     * @param text OCR识别的文本内容
     * @param defaultTags 默认标签，当没有匹配时返回
     * @param maxLength 最大返回标签数量，默认为3
     * @returns 标签ID数组
     */
    generateTags(text: string, defaultTags: string[] = ['other'], maxLength: number = 3): string[] {
        if (!text?.trim()) return defaultTags;

        // 1. 文本分块
        const chunks = this.chunkText(text);
        const tagScores = new Map<string, number>();

        // 2. 遍历每个文本块进行匹配
        for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            // 3. 在当前块中为所有标签打分
            for (const config of BASE_TAGS) {
                if (!config.keywords.length) continue;

                const bestMatch = ClassEngine.findBestMatch(chunk, config.keywords);
                if (bestMatch) {
                    const currentScore = tagScores.get(config.id) || 0;
                    // 4. 聚合：保留所有块中的最高分
                    if (bestMatch.score > currentScore) {
                        tagScores.set(config.id, bestMatch.score);
                    }
                }
            }
        }

        // 5. 排序并返回结果
        if (tagScores.size === 0) {
            return defaultTags;
        }

        // 将 Map 转换为数组并按分数降序排序
        const sortedScores = Array.from(tagScores.entries())
            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

        // 限制返回标签数量
        return sortedScores.slice(0, maxLength).map(([id]) => id);
    }
}

export const tagService = new TagService();
