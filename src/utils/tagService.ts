import i18n from "@/plugins/i18n"

/** 标签配置接口 */
interface TagConfig {
    id: string
    name?: string
    icon?: string
    color?: string
    keywords: readonly string[]
}

// 统一的标签配置
export const BASE_TAGS: readonly TagConfig[] = [
    {
        id: 'identity_card',
        name: i18n.global.t('identity_card'),
        icon: 'mdi-card-account-details',
        color: '#4285F4',
        keywords: [
            '中华人民共和国', '居民身份证', '签发机关', '有效期限', '公民身份号码', '身份证', '姓名', '民族', '出生', '住址',
            'ID Card', 'Identity Card', 'ID card', 'identity card',
        ],
    },
    {
        id: 'business_license',
        name: i18n.global.t('business_license'),
        icon: 'mdi-domain',
        color: '#34A853',
        keywords: [
            '营业执照', '工商营业执照', '企业营业执照', '公司执照', '统一社会信用代码', '社会信用代码', '信用代码',
            'Business License'
        ]
    },
    {
        id: 'student_card',
        name: i18n.global.t('student_card'),
        icon: 'mdi-school',
        color: '#EA4335',
        keywords: [
            '学生证', '学生卡', '校园卡', '学籍卡',
            'Student ID', 'Student Card', 'Campus Card'
        ]
    },
    {
        id: 'contract',
        name: i18n.global.t('contract'),
        icon: 'mdi-file-document-box-multiple',
        color: '#FF0000',
        keywords: [
            '合同', '协议', '合约', '签署协议', '法律协议', '合作协议', '服务合同', '劳动合同', '租赁合同', '采购合同', '保密协议'
        ]
    },
    {
        id: 'report',
        name: i18n.global.t('report'),
        icon: 'mdi-file-chart',
        color: '#FFA500',
        keywords: [
            '报告', '分析报告', '调研报告', '工作报告', '研究报告', '检测报告', '审计报告', '评估报告', '实验报告',
            'Report', 'Analysis Report', 'Survey Report'
        ]
    },
    {
        id: 'resume',
        name: i18n.global.t('resume'),
        icon: 'mdi-file-document-edit',
        color: '#800080',
        keywords: [
            '简历', '个人简历', '求职简历', '工作经历', '教育背景', '联系方式', '期望职位',
            'Resume',
        ]
    },
    {
        id: 'invoice',
        name: i18n.global.t('invoice'),
        icon: 'mdi-receipt',
        color: '#00CED1',
        keywords: [
            '发票', '增值税发票', '电子发票', '普通发票', '专用发票', '开票', '发票代码', '发票号码', '金额合计', '价税合计',
            'Invoice', 'VAT Invoice', 'Tax Invoice', '收据', '付款凭证',
        ]
    },
    {
        id: 'document',
        name: i18n.global.t('document'),
        icon: 'mdi-file',
        color: '#FFA500',
        keywords: [
            '文档', '文件', '资料', '材料', 'Word', 'PDF', '扫描件',
            'Document', 'File', 'Attachment', 'Official Document'
        ]
    },
    {
        id: 'education_certificate',
        name: i18n.global.t('education_certificate'),
        icon: 'mdi-school-outline',
        color: '#FFD700',
        keywords: [
            '毕业证书', '学位证书', '学历证书', '学历', '学位', '学士', '硕士', '博士', '结业证书', '肄业证明',
            'Diploma', 'Degree Certificate', 'Bachelor', 'Master', 'PhD',
        ]
    },
    {
        id: 'professional',
        name: i18n.global.t('professional'),
        icon: 'mdi-certificate',
        color: '#FFA500',
        keywords: [
            '资格证书', '专业证书', '执业证书', '认证证书', '软考', '职称证书', '教师资格证', '律师执业证', '医师资格证', '建造师证',
            'Certification', 'License', 'Professional Certificate', 'PMP', 'CPA', 'CFA',
        ]
    },
    {
        id: 'other',
        icon: 'mdi-tag-multiple',
        color: '#A9A9A9',
        name: i18n.global.t('other'),
        keywords: [],
    }
]

/**
 * 分类引擎
 */
class ClassEngine {
    static normalizeText(text: string): string {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[\p{P}\p{S}\u200B-\u200F\uFEFF]/gu, '');
    }

    /** 编辑距离（空间优化版） */
    static editDistance(a: string, b: string): number {
        if (a === b) return 0;
        const m = a.length, n = b.length;
        if (m === 0) return n;
        if (n === 0) return m;

        let prev = Array.from({ length: n + 1 }, (_, i) => i);
        let curr = new Array(n + 1);

        for (let i = 1; i <= m; i++) {
            curr[0] = i;
            for (let j = 1; j <= n; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
            }
            [prev, curr] = [curr, prev];
        }
        return prev[n];
    }

    static similarity(a: string, b: string): number {
        if (!a || !b) return 0;
        const maxLen = Math.max(a.length, b.length);
        return 1 - ClassEngine.editDistance(a, b) / maxLen;
    }

    /**
     * 更合理的关键词匹配策略：
     * 1. 精确子串匹配（最高优先级）
     * 2. 高相似度模糊匹配（仅用于长词，阈值 0.85）
     */
    static matchScore(normalizedText: string, normalizedKeyword: string): number {
        if (!normalizedKeyword) return 0;

        // 精确子串匹配（最强信号）
        if (normalizedText.includes(normalizedKeyword)) {
            return 1.0;
        }

        // 短词不模糊匹配（避免“卡”匹配“合同”）
        if (normalizedKeyword.length < 5) {
            return 0;
        }

        // 高阈值模糊匹配（减少误报）
        const sim = ClassEngine.similarity(normalizedText, normalizedKeyword);
        return sim >= 0.85 ? 0.7 * sim : 0;
    }
}

class TagService {
    private chunkText(text: string, maxChunkLength = 800): string[] {
        // 优先按自然段落或句子切分
        const sentences = text.split(/(?<=[。！？.!?])\s*/).filter(s => s.trim().length > 8);
        if (sentences.length > 1) return sentences;

        // 否则按长度切分
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += maxChunkLength) {
            chunks.push(text.slice(i, i + maxChunkLength));
        }
        return chunks.length ? chunks : [text];
    }

    generateTags(text: string, defaultTags: string[] = ['other'], maxLength = 3): string[] {
        if (!text?.trim()) return defaultTags;

        const chunks = this.chunkText(text);
        const tagScores = new Map<string, number>();

        // 1. 预处理关键词，统计每个关键词属于多少个标签
        const keywordTagMap = new Map<string, Set<string>>();
        const tagEntries = BASE_TAGS.map(config => ({
            id: config.id,
            normalizedKeywords: config.keywords.map(kw => ClassEngine.normalizeText(kw)).filter(k => k.length > 0)
        })).filter(entry => entry.normalizedKeywords.length > 0);

        for (const { id, normalizedKeywords } of tagEntries) {
            for (const kw of normalizedKeywords) {
                if (!keywordTagMap.has(kw)) keywordTagMap.set(kw, new Set());
                keywordTagMap.get(kw)!.add(id);
            }
        }

        // 2. 计算每个关键词的独占性权重（独占=1，被多个标签共享则<1）
        const keywordWeight = new Map<string, number>();
        for (const [kw, tagSet] of keywordTagMap.entries()) {
            keywordWeight.set(kw, 1 / tagSet.size);
        }

        // 3. 匹配文本并打分
        for (const chunk of chunks) {
            const normChunk = ClassEngine.normalizeText(chunk);
            if (!normChunk) continue;

            for (const { id, normalizedKeywords } of tagEntries) {
                let maxScore = 0;
                let hitCount = 0;
                let sumWeight = 0;

                for (const kw of normalizedKeywords) {
                    const score = ClassEngine.matchScore(normChunk, kw);
                    if (score > 0) {
                        hitCount++;
                        const weight = keywordWeight.get(kw) ?? 1;
                        sumWeight += weight;
                        // 独占性权重提升分数
                        const weightedScore = score * (0.7 + 0.6 * weight); // 独占性越高，分数越高（最多1.3倍）
                        if (weightedScore > maxScore) maxScore = weightedScore;
                    }
                }

                if (maxScore > 0) {
                    // 多关键词命中则加权（提升置信度，按独占性加权）
                    const boost = Math.min(1.0, 0.18 * sumWeight); // sumWeight越大，boost越高
                    const finalScore = Math.min(1.0, maxScore + boost);

                    const current = tagScores.get(id) || 0;
                    if (finalScore > current) {
                        tagScores.set(id, finalScore);
                    }
                }
            }
        }

        if (tagScores.size === 0) return defaultTags;

        // 4. 排序时优先高分+高独占性（如分数相同，优先独占性高的标签）
        return Array.from(tagScores.entries())
            .sort((a, b) => {
                if (b[1] !== a[1]) return b[1] - a[1];
                // 分数相同则比较该标签所有关键词的平均独占性
                const avgWeight = (id: string) => {
                    const entry = tagEntries.find(e => e.id === id);
                    if (!entry) return 0;
                    const weights = entry.normalizedKeywords.map(kw => keywordWeight.get(kw) ?? 1);
                    return weights.length ? weights.reduce((s, w) => s + w, 0) / weights.length : 0;
                };
                return avgWeight(b[0]) - avgWeight(a[0]);
            })
            .slice(0, maxLength)
            .map(([id]) => id);
    }
}

export const tagService = new TagService();