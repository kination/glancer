const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      './backend/dist/backend_server',
      './backend/bin/ollama'
    ],
    ignore: [
      /^\/src/,
      /^\/electron/,
      /^\/backend/,
      /^\/\.idea/,
      /^\/\.vscode/,
      /^\/\.git/,
      /.*\\.md$/,
      /.*\\.map$/,
      /^\/node_modules\/\.bin/,
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry points to allow for multiple windows.
        build: [
          {
            // `entry` is just an alias for `build.entry` in the Electron Forge API
            entry: 'electron/main.js',
            config: 'vite.main.config.ts',
          },
          {
            entry: 'electron/preload.js',
            config: 'vite.preload.config.ts',
          },
        ],
        // `renderer` enables HMR and DevTools integration with Vite.
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.ts',
          },
        ],
      },
    },
  ],
};
