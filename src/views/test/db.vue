<template>
    <v-app>
        <v-app-bar color="primary">
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>数据库测试</v-app-bar-title>
        </v-app-bar>

        <v-main>
            <v-container class="pa-4">
                <!-- 统计信息 -->
                <v-card class="mb-4">
                    <v-card-title>数据统计</v-card-title>
                    <v-card-text>
                        <v-chip class="mr-2" color="primary">文件: {{ fileCount }}</v-chip>
                        <v-chip color="secondary">OCR: {{ ocrCount }}</v-chip>
                    </v-card-text>
                </v-card>

                <!-- 文件测试 -->
                <v-card class="mb-4">
                    <v-card-title>文件记录 (files_list)</v-card-title>
                    <v-card-text>
                        <v-text-field v-model="fileForm.relative_path" label="relative_path (相对路径)" density="compact"
                            class="mb-2" />
                        <v-text-field v-model="fileForm.type" label="type (文件类型)" density="compact" class="mb-2" />
                        <v-text-field v-model="fileForm.tags" label="tags (标签)" density="compact" class="mb-2" />
                        <div class="mb-3">
                            <v-btn @click="addFile" color="primary" size="small" class="mr-2">
                                添加/更新
                            </v-btn>
                            <v-btn @click="loadFiles" variant="outlined" size="small">
                                刷新
                            </v-btn>
                        </div>

                        <v-list v-if="fileRecords.length > 0" density="compact">
                            <v-list-item v-for="file in fileRecords.slice(0, 3)" :key="file.id">
                                <v-list-item-title class="text-body-2">
                                    {{ file.relative_path }} (ID: {{ file.id }})
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    type: {{ file.type }} | tags: {{ file.tags || '空' }}
                                </v-list-item-subtitle>
                                <v-list-item-subtitle class="text-caption">
                                    mtime: {{ file.mtime || '未设置' }}
                                </v-list-item-subtitle>
                                <template v-slot:append>
                                    <v-btn icon="mdi-delete" size="small" color="error" variant="text"
                                        @click="deleteFile(file.relative_path)" />
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>

                <!-- OCR测试 -->
                <v-card class="mb-4">
                    <v-card-title>OCR记录 (ocr_records)</v-card-title>
                    <v-card-text>
                        <v-text-field v-model="ocrForm.relative_path" label="relative_path (相对路径)" density="compact"
                            class="mb-2" />
                        <v-textarea v-model="ocrForm.text" label="text (识别文本)" rows="2" density="compact"
                            class="mb-2" />
                        <v-textarea v-model="ocrForm.block" label="block (文本块信息)" rows="1" density="compact"
                            class="mb-2" />
                        <div class="mb-3">
                            <v-btn @click="addOCR" color="primary" size="small" class="mr-2">
                                添加/更新
                            </v-btn>
                            <v-btn @click="loadOCRs" variant="outlined" size="small">
                                刷新
                            </v-btn>
                        </div>

                        <v-list v-if="ocrRecords.length > 0" density="compact">
                            <v-list-item v-for="ocr in ocrRecords.slice(0, 3)" :key="ocr.id">
                                <v-list-item-title class="text-body-2">
                                    {{ ocr.relative_path }} (ID: {{ ocr.id }})
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    text: {{ ocr.text?.substring(0, 30) }}...
                                </v-list-item-subtitle>
                                <v-list-item-subtitle class="text-caption">
                                    update_time: {{ ocr.update_time || '未设置' }}
                                </v-list-item-subtitle>
                                <template v-slot:append>
                                    <v-btn icon="mdi-delete" size="small" color="error" variant="text"
                                        @click="deleteOCR(ocr.relative_path)" />
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>

            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { filesListDB, ocrRecordsDB, type FileRecord, type OCRRecord } from '@/utils/dbService'
import snackbarService from '@/components/global/snackbarService'

// 响应式数据
const fileRecords = ref<FileRecord[]>([])
const ocrRecords = ref<OCRRecord[]>([])
const fileCount = ref(0)
const ocrCount = ref(0)

// 表单数据
const fileForm = ref({
    type: '',
    relative_path: '',
    tags: ''
})

const ocrForm = ref({
    relative_path: '',
    text: '',
    block: ''
})

// 文件操作
const addFile = async () => {
    if (!fileForm.value.type || !fileForm.value.relative_path) {
        snackbarService.error('请填写必要字段')
        return
    }

    try {
        const record: FileRecord = {
            type: fileForm.value.type,
            relative_path: fileForm.value.relative_path,
            tags: fileForm.value.tags,
            mtime: new Date().toISOString(),
            atime: new Date().toISOString(),
            birthtime: new Date().toISOString()
        }

        await filesListDB.upsert(record)
        snackbarService.success('文件记录添加成功')

        fileForm.value = { type: '', relative_path: '', tags: '' }
        await loadFiles()
    } catch (error) {
        snackbarService.error('操作失败')
    }
}

const loadFiles = async () => {
    try {
        fileRecords.value = await filesListDB.getAll()
        fileCount.value = await filesListDB.getCount()
    } catch (error) {
        snackbarService.error('加载失败')
    }
}

// OCR操作
const addOCR = async () => {
    if (!ocrForm.value.relative_path) {
        snackbarService.error('请填写路径')
        return
    }

    try {
        const record: OCRRecord = {
            relative_path: ocrForm.value.relative_path,
            text: ocrForm.value.text,
            block: ocrForm.value.block
        }

        await ocrRecordsDB.upsert(record)
        snackbarService.success('OCR记录添加成功')

        ocrForm.value = { relative_path: '', text: '', block: '' }
        await loadOCRs()
    } catch (error) {
        snackbarService.error('操作失败')
    }
}

const loadOCRs = async () => {
    try {
        ocrRecords.value = await ocrRecordsDB.getAll()
        ocrCount.value = await ocrRecordsDB.getCount()
    } catch (error) {
        snackbarService.error('加载失败')
    }
}



// 删除操作
const deleteFile = async (relativePath: string) => {
    try {
        await filesListDB.deleteByPath(relativePath)
        snackbarService.success('文件记录删除成功')
        await loadFiles()
    } catch (error) {
        snackbarService.error('删除失败')
    }
}

const deleteOCR = async (relativePath: string) => {
    try {
        await ocrRecordsDB.deleteByPath(relativePath)
        snackbarService.success('OCR记录删除成功')
        await loadOCRs()
    } catch (error) {
        snackbarService.error('删除失败')
    }
}

// 初始化
onMounted(async () => {
    await Promise.all([loadFiles(), loadOCRs()])
})
</script>
