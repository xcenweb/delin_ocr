<template>
    <v-layout>
        <v-app-bar :title="title" :subtitle="subtitle" :color="color" density="compact" flat>
            <template #prepend>
                <v-btn v-if="showBack" icon variant="text" @click="$router.back()">
                    <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
            </template>
            <template #append>
                <slot name="append"></slot>
            </template>
        </v-app-bar>
        <v-main>
            <v-container class="pa-0" fluid>
                <router-view />
            </v-container>
        </v-main>
    </v-layout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { defineProps, withDefaults } from 'vue'

// 使用 withDefaults 定义带默认值的 props
const props = withDefaults(
    defineProps({
        /**
         * AppBar 显示的主标题
         * @type {String}
         */
        title: { type: String },
        /**
         * AppBar 显示的副标题
         * @type {String}
         */
        subtitle: { type: String },
        /**
         * Appbar 是否显示返回按钮
         * @type {Boolean}
         */
        showBack: { type: Boolean },
        /**
         * AppBar 的颜色
         * @type {String}
         */
        color: { type: String }
    }),
    {
        title: '',
        subtitle: '',
        showBack: true,
        color: 'primary'
    }
)
</script>

<style scoped></style>