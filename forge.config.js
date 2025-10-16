// @ts-check

import { MakerZIP } from '@electron-forge/maker-zip'
import { VitePlugin } from '@electron-forge/plugin-vite'

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  makers: [new MakerZIP({}, ['darwin'])],
  packagerConfig: {
    appBundleId: 'com.browserosaurus',
    appCategoryType: 'public.app-category.developer-tools',
    asar: false,
    extendInfo: 'plist/Info.plist',
    icon: 'src/shared/static/icon/icon.icns',
    // osxNotarize and osxSign removed for local builds to prevent signing errors
    protocols: [
      {
        name: 'HTTP link',
        schemes: ['http', 'https'],
      },
      {
        name: 'File',
        schemes: ['file'],
      },
    ],
  },
  plugins: [
    new VitePlugin({
      build: [
        {
          config: 'vite.main.config.ts',
          entry: 'src/main/main.ts',
        },
        {
          config: 'vite.preload.config.ts',
          entry: 'src/renderers/shared/preload.ts',
        },
      ],
      renderer: [
        {
          config: 'vite.renderer.prefs.config.ts',
          name: 'prefs_window',
        },
        {
          config: 'vite.renderer.picker.config.ts',
          name: 'picker_window',
        },
      ],
    }),
  ],
}

export default config
