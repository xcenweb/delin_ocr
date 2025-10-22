/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */
import 'vuetify/styles'
import { type ThemeDefinition, createVuetify } from 'vuetify'

import colors from 'vuetify/util/colors'
import { md3 } from 'vuetify/blueprints'

import '@mdi/font/css/materialdesignicons.css'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const light_theme: ThemeDefinition = {
    dark: false,
    colors: {
        primary: colors.purple.lighten2,
        secondary: colors.grey.lighten4,
    },
}
const dark_theme: ThemeDefinition = {
    dark: true,
    colors: {
        primary: colors.purple.lighten4,
        secondary: colors.grey.lighten2,
    },
}
// TODO 用户自定义主题颜色
const custom_theme: ThemeDefinition = {
    dark: true,
    colors: {
        primary: "",
        secondary: "",
    },
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
    blueprint: md3,
    // ssr: true,
    theme: {
        defaultTheme: 'system',
        themes: {
            light: light_theme,
            dark: dark_theme
        }
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
})