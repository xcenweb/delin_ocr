/** 标签配置接口 */
interface TagConfig {
    id: string;
    keywords: readonly string[];
}

// 统一的标签配置（设为只读，防止意外修改）
const TAG_CONFIGS: readonly TagConfig[] = [
    { id: 'identity_card', keywords: ['居民身份证', '身份证', '公民身份', 'ID Card', 'Identity Card'] },
    { id: 'driver_license', keywords: ['驾驶证', '机动车驾驶证', 'Driver License', 'Driving License'] },
    { id: 'passport', keywords: ['护照', 'Passport', 'PASSPORT', '中华人民共和国护照'] },
    { id: 'business_license', keywords: ['营业执照', '工商营业执照', 'Business License', '统一社会信用代码'] },
    { id: 'residence_permit', keywords: ['居住证', '暂住证', 'Residence Permit'] },
    { id: 'student_id', keywords: ['学生证', 'Student ID', '学生卡'] },
    { id: 'employee_id', keywords: ['工作证', '员工证', 'Employee ID', '职工证'] },
    { id: 'bank_card', keywords: ['银行卡', '储蓄卡', '信用卡', 'Bank Card', 'Credit Card', 'Debit Card'] },
    { id: 'social_security_card', keywords: ['社保卡', '社会保障卡', 'Social Security Card'] },
    { id: 'medical_insurance_card', keywords: ['医保卡', '医疗保险卡', 'Medical Insurance Card'] },
    { id: 'contract', keywords: ['合同', '协议', 'Contract', 'Agreement', '合作协议', '服务合同'] },
    { id: 'report', keywords: ['报告', '分析报告', 'Report', '调研报告', '工作报告', '研究报告'] },
    { id: 'notice', keywords: ['公告', '通知', 'Notice', '声明', '公示'] },
    { id: 'resume', keywords: ['简历', '履历', 'Resume', 'CV', '个人简历'] },
    { id: 'transcript', keywords: ['成绩单', 'Transcript', '学习成绩', '考试成绩'] },
    { id: 'other', keywords: [] }
];

/**
 * 分类引擎 - 提供文本处理和关键词匹配功能
 */
class ClassEngine {
    /**
     * 文本标准化 - 移除空格和干扰字符
     * @param text 原始文本
     * @returns 标准化后的文本
     */
    static normalizeText(text: string): string {
        if (!text) return '';

        return text
            .toLowerCase()
            .replace(/\s+/g, '') // 移除所有空白字符
            .replace(/[\.,;:!?"'()\[\]{}|\\\/_+=\-*&^%$#@~`]/g, '') // 移除标点符号
            .replace(/[\u200B-\u200F\uFEFF]/g, ''); // 移除零宽字符
    }

    /**
     * 检查文本是否按顺序包含关键词的所有字符（允许中间插入任意字符）
     * @param text 标准化后的文本
     * @param keyword 标准化后的关键词
     * @returns 是否匹配
     */
    static containsCharSequence(text: string, keyword: string): boolean {
        if (!keyword) return true;
        if (!text || keyword.length > text.length) return false;

        let keywordIndex = 0;
        for (let char of text) {
            if (char === keyword[keywordIndex]) {
                keywordIndex++;
                if (keywordIndex === keyword.length) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 计算两个字符串的编辑距离（Levenshtein距离）
     * @param str1 字符串1
     * @param str2 字符串2
     * @returns 编辑距离
     */
    static editDistance(str1: string, str2: string): number {
        // 确保str1是较短的字符串，优化空间复杂度
        if (str1.length > str2.length) {
            [str1, str2] = [str2, str1];
        }

        let previousRow = Array.from({ length: str1.length + 1 }, (_, i) => i);

        for (let i = 1; i <= str2.length; i++) {
            const currentRow = [i];

            for (let j = 1; j <= str1.length; j++) {
                const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
                currentRow.push(
                    Math.min(
                        previousRow[j] + 1,        // 删除
                        currentRow[j - 1] + 1,     // 插入
                        previousRow[j - 1] + cost  // 替换
                    )
                );
            }

            previousRow = currentRow;
        }

        return previousRow[str1.length];
    }

    /**
     * 计算字符串相似度
     * @param str1 字符串1
     * @param str2 字符串2
     * @returns 相似度（0-1之间）
     */
    static similarity(str1: string, str2: string): number {
        if (str1 === str2) return 1;
        if (!str1.length || !str2.length) return 0;

        const distance = ClassEngine.editDistance(str1, str2);
        return 1 - distance / Math.max(str1.length, str2.length);
    }

    /**
     * 检查文本中是否包含关键词（支持容错匹配）
     * @param text 待检查的文本
     * @param keywords 关键词列表
     * @param threshold 相似度阈值，默认使用全局阈值
     * @returns 匹配的关键词列表
     */
    static checkKeywords(text: string, keywords: readonly string[], threshold = 0.7): string[] {
        if (!keywords.length) return [];

        const normalizedText = ClassEngine.normalizeText(text);
        const matches: string[] = [];

        for (const keyword of keywords) {
            const normalizedKeyword = ClassEngine.normalizeText(keyword);
            if (!normalizedKeyword) continue;

            // 1. 精确匹配
            if (normalizedText.includes(normalizedKeyword)) {
                matches.push(keyword);
                continue;
            }

            // 2. 字符序列匹配（新策略：应对插入干扰字符）
            if (ClassEngine.containsCharSequence(normalizedText, normalizedKeyword)) {
                matches.push(keyword);
                continue;
            }

            // 3. 短关键词不进行模糊匹配
            if (normalizedKeyword.length < 2) continue;

            // 4. 整体相似度匹配（适用于较长关键词）
            if (normalizedKeyword.length >= 4 &&
                ClassEngine.similarity(normalizedText, normalizedKeyword) >= threshold) {
                matches.push(keyword);
                continue;
            }

            // 5. 滑动窗口匹配（保持兼容性）
            const windowSize = normalizedKeyword.length;
            if (windowSize <= normalizedText.length) {
                for (let i = 0; i <= normalizedText.length - windowSize; i++) {
                    if (ClassEngine.similarity(
                        normalizedText.substring(i, i + windowSize),
                        normalizedKeyword
                    ) >= threshold) {
                        matches.push(keyword);
                        break;
                    }
                }
            }
        }

        return matches;
    }
}

/**
 * 标签服务类 - 处理标签生成和管理
 */
class TagService {
    // 缓存所有标签ID，避免重复计算
    private allTags?: string[];

    /**
     * 根据OCR识别的文本内容生成标签
     * @param text OCR识别的文本内容
     * @param defaultTags 无匹配时的默认标签，默认值为['other']
     * @returns 标签数组
     */
    generateTags(text: string, defaultTags: string[] = ['other']): string[] {
        if (!text?.trim()) {
            return defaultTags;
        }

        // 计算每个标签的匹配分数
        const tagScores = Array.from(TAG_CONFIGS)
            .filter(config => config.keywords.length > 0)
            .reduce((scores, config) => {
                const matchCount = ClassEngine.checkKeywords(text, config.keywords).length;
                if (matchCount > 0) {
                    scores.set(config.id, (scores.get(config.id) || 0) + matchCount);
                }
                return scores;
            }, new Map<string, number>());

        // 按分数排序并返回结果
        const sortedTags = Array.from(tagScores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([tag]) => tag);

        return sortedTags.length ? sortedTags : defaultTags;
    }

    /**
     * 获取所有可用的标签ID
     * @returns 标签ID数组
     */
    getAllTags(): string[] {
        if (!this.allTags) {
            this.allTags = TAG_CONFIGS.map(config => config.id);
        }
        return [...this.allTags]; // 返回副本防止外部修改
    }
}

// 导出单例实例
export const tagService = new TagService();