<template>
    <v-app class="h-100 d-flex flex-column position-relative overflow-hidden overflow-y-auto">
        <v-main style="padding-top: env(safe-area-inset-top);">
            <v-card class="ma-6 rounded-lg">
                <v-card-text class="d-flex align-center">
                    <v-avatar size="64" color="white">
                        <v-img src="/images/avatar.png"></v-img>
                    </v-avatar>
                    <div class="ml-4 flex-grow-1">
                        <div class="text-h6 font-weight-bold">用户名</div>
                    </div>
                    <v-btn icon size="small" variant="text">
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                </v-card-text>
            </v-card>
        </v-main>
    </v-app>
</template>

<script setup></script>

<style scoped></style>