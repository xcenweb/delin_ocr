<template>
    <v-app key="tag-service">
        <!-- 顶部导航 -->
        <v-app-bar flat color="primary">
            <v-btn icon @click="$router.back()">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <v-toolbar-title>TagService 测试</v-toolbar-title>
        </v-app-bar>

        <v-main>
            <v-container class="pa-4">
                <v-card class="mb-4">
                    <v-card-title>标签生成测试</v-card-title>
                    <v-card-text>
                        <v-textarea v-model="inputText" label="输入测试文本" rows="4" outlined clearable
                            @input="generateTags"></v-textarea>

                        <v-btn @click="generateTags" color="primary" class="mr-2">生成标签</v-btn>
                        <v-btn @click="clearAll" color="error">清空</v-btn>

                        <v-divider class="my-4"></v-divider>

                        <div class="text-h6 mb-2">生成结果：</div>
                        <div v-if="resultTags.length > 0">
                            <v-chip v-for="tag in resultTags" :key="tag" class="ma-1"
                                :color="tag === 'other' ? 'grey' : 'primary'" outlined>
                                {{ tag }}
                            </v-chip>
                        </div>
                        <div v-else class="text--secondary">
                            暂无标签
                        </div>

                        <v-divider class="my-4"></v-divider>

                        <div class="text-h6 mb-2">所有标签：</div>
                        <div>
                            <v-chip v-for="tag in allTags" :key="tag" class="ma-1" small>
                                {{ tag }}
                            </v-chip>
                        </div>
                    </v-card-text>
                </v-card>

                <v-card>
                    <v-card-title>预设测试用例</v-card-title>
                    <v-card-text>
                        <v-list>
                            <v-list-item v-for="(testCase, index) in testCases" :key="index"
                                @click="loadTestCase(testCase)">
                                <v-list-item-title>{{ testCase.name }}</v-list-item-title>
                                <v-list-item-subtitle class="text--secondary">
                                    {{ testCase.text }}
                                </v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { tagService } from '@/utils/tagService';

// 输入文本
const inputText = ref('');

// 结果标签
const resultTags = ref<string[]>([]);

// 所有标签
const allTags = ref<string[]>([]);

// 测试用例
const testCases = [
    {
        name: '身份证测试',
        text: '居民身份证是用于证明居住在中华人民共和国境内的公民的身份证明文件'
    },
    {
        name: '驾驶证测试',
        text: '机动车驾驶证是驾驶机动车上路行驶的法定证件'
    },
    {
        name: '营业执照测试',
        text: '工商营业执照是企业合法经营的重要凭证'
    },
    {
        name: '合同测试',
        text: '本协议是双方就合作事宜达成的正式合同'
    },
    {
        name: '无匹配测试',
        text: '这是一段没有任何预设关键词的测试文本'
    }
];

// 生成标签
const generateTags = () => {
    if (inputText.value.trim()) {
        resultTags.value = tagService.generateTags(inputText.value);
    } else {
        resultTags.value = [];
    }
};

// 清空所有
const clearAll = () => {
    inputText.value = '';
    resultTags.value = [];
};

// 加载测试用例
const loadTestCase = (testCase: { name: string; text: string }) => {
    inputText.value = testCase.text;
    generateTags();
};

// 初始化
onMounted(() => {
    allTags.value = tagService.getAllTags();
});
</script>