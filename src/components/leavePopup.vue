<template>
    <v-dialog v-model="confirmShow" max-width="400" persistent>
        <v-card :title="props.title">
            <template v-slot:text>
                <p>{{ props.message }}</p>
            </template>
            <template v-slot:actions>
                <v-btn text="确认" @click="confirm" />
                <v-btn text="取消" @click="cancel" />
            </template>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useSnackbar } from './global/snackbarService';

const props = withDefaults(defineProps<{
    leave?: boolean,
    dialog?: boolean,
    title?: string,
    message?: string,
    onCancel?: () => void,
    onConfirm?: () => void,
    onBeforeLeave?: () => Promise<boolean> | boolean,
}>(), {
    leave: false,
    dialog: true,
    title: '确认退出？',
    message: '是否放弃编辑？未保存的更改将会丢失。',
    onCancel: () => { },
    onConfirm: () => { },
    onBeforeLeave: () => { return true }
});

const confirmShow = ref(false)
let resolveFn: ((value: unknown) => void) | null = null
let rejectFn: ((reason?: any) => void) | null = null

// 取消
const cancel = () => {
    rejectFn && rejectFn()
    props.onCancel()
    confirmShow.value = false
};

// 确认
const confirm = () => {
    resolveFn && resolveFn(undefined)
    props.onConfirm()
    confirmShow.value = false
};

onBeforeRouteLeave(async (to, from, next) => {
    try {
        // 先检查 onBeforeLeave 返回值
        if (!props.onBeforeLeave()){
            next(false)
            return
        }

        // 如果允许直接离开
        if (props.leave) {
            next()
            return
        }

        // 如果需要显示对话框确认
        if (props.dialog) {
            await new Promise((resolve, reject) => {
                resolveFn = resolve
                rejectFn = reject
                confirmShow.value = true
            });
            next()
        } else {
            next(false)
        }
    } catch {
        next(false)
    }
});
</script>