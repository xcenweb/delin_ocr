/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

import { type ThemeDefinition, createVuetify } from 'vuetify'
import 'vuetify/styles'

import { md3 } from 'vuetify/blueprints'

import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

const light_theme: ThemeDefinition = {
    dark: false,
    colors: {
        primary: '#c869c8',
        // secondary: '#ffddff',
    },
}
const dark_theme: ThemeDefinition = {
    dark: true,
    colors: {
        primary: '#ffddff',
        secondary: '#c869c8',
    },
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
    blueprint: md3,
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
    ssr: true,
})

