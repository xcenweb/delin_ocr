// 退出确认组件

<template>
    <v-dialog v-model="confirmShow" max-width="400">
        <v-card>
            <v-card-title>
                确认退出
            </v-card-title>
            <v-card-text>
                {{ props.message }}
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="cancel">
                    取消
                </v-btn>
                <v-btn color="primary" @click="confirm">
                    确认
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';

const props = withDefaults(defineProps<{
    /** 是否直接允许离开 */
    effect?: boolean,
    /** 是否显示弹窗 */
    showDialog?: boolean,
    /** 弹窗消息 */
    message?: string,
    /** 返回键处理闭包，返回true表示可以继续路由离开流程，返回false表示阻止离开 */
    onBeforeLeave?: () => boolean,
}>(), {
    effect: true,
    showDialog: true,
    message: '是否放弃编辑？未保存的更改将会丢失。'
});

// 退出确认逻辑
/** 确认对话框显示状态 */
const confirmShow = ref(false);
const out = ref(false);
const router = useRouter();

// 用于Promise的resolve和reject函数
let resolveFn: (() => void) | null = null;
let rejectFn: (() => void) | null = null;

// 取消离开的处理函数
const cancel = () => {
    rejectFn && rejectFn();
    confirmShow.value = false;
};

// 确认离开的处理函数
const confirm = () => {
    resolveFn && resolveFn();
    confirmShow.value = false;
};

// 路由离开守卫
onBeforeRouteLeave(async (to, from, next) => {
    // 如果有自定义的离开前处理函数
    if (props.onBeforeLeave) {
        const canLeave = props.onBeforeLeave();
        if (!canLeave) {
            next(false);
            return;
        }
    }

    // 如果effect为false，直接允许离开
    if (!props.effect) {
        next();
        return;
    }

    if (out.value) {
        next();
    } else {
        next(false);

        await new Promise((resolve, reject) => {
            resolveFn = resolve as () => void;
            rejectFn = reject as () => void;
            setTimeout(() => {
                if (props.showDialog) confirmShow.value = true;
            }, 20);
        })
            .then(() => {
                out.value = true;
                router.back();
            })
            .catch(() => {
                // 用户取消，不做任何操作
            });
    }
});
</script>

<style scoped>
/* 组件样式 */
</style>