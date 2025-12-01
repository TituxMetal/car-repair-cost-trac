import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { $ } from 'bun'
import type { BunPlugin } from 'bun'

const projectRoot = import.meta.dirname

// Ensure dist directory exists
const distPath = join(projectRoot, 'dist')
const assetsPath = join(distPath, 'assets')
if (!existsSync(assetsPath)) {
  mkdirSync(assetsPath, { recursive: true })
}

console.log('🔨 Building frontend with Bun...')

// Step 1: Build CSS with Tailwind CLI
console.log('🎨 Building CSS with Tailwind CLI...')
const cssInputPath = join(projectRoot, 'src/main.css')
const cssTempOutputPath = join(assetsPath, 'styles.css')

try {
  await $`npx @tailwindcss/cli -i ${cssInputPath} -o ${cssTempOutputPath} --minify`.quiet()
  console.log('✅ CSS build successful')
} catch (error) {
  console.error('❌ CSS build failed:', error)
  process.exit(1)
}

// Generate hash for CSS file for cache busting
const cssContent = await Bun.file(cssTempOutputPath).text()
const cssHash = createHash('md5').update(cssContent).digest('hex').slice(0, 8)
const cssFileName = `styles.${cssHash}.css`
const cssFinalPath = join(assetsPath, cssFileName)

// Rename CSS file with hash
await Bun.write(cssFinalPath, cssContent)
await $`rm ${cssTempOutputPath}`.quiet()

// Plugin to ignore CSS imports (they are handled by Tailwind CLI)
const ignoreCssPlugin: BunPlugin = {
  name: 'ignore-css',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, () => {
      return {
        contents: '',
        loader: 'js'
      }
    })
  }
}

// Step 2: Build JavaScript with Bun (without tailwind plugin since CSS is handled separately)
console.log('📦 Building JavaScript with Bun...')
const result = await Bun.build({
  entrypoints: [join(projectRoot, 'src/main.tsx')],
  outdir: join(projectRoot, 'dist/assets'),
  target: 'browser',
  format: 'esm',
  splitting: true,
  minify: true,
  sourcemap: 'linked',
  naming: {
    entry: '[name].[hash].js',
    chunk: '[name]-[hash].js',
    asset: '[name]-[hash].[ext]'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  plugins: [ignoreCssPlugin]
})

if (!result.success) {
  console.error('❌ JavaScript build failed:')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

console.log('✅ JavaScript build successful')

// Find the generated entry files
const outputs = result.outputs
const mainEntry = outputs.find(o => o.path.includes('main') && o.path.endsWith('.js'))

if (!mainEntry) {
  console.error('❌ No main JavaScript entry found in build output')
  process.exit(1)
}

const mainJsFileName = mainEntry.path.split('/').pop()!

// Generate index.html
console.log('📄 Generating index.html...')
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Car Maintenance Tracker</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="/assets/${cssFileName}" rel="stylesheet" />
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/assets/${mainJsFileName}"></script>
</body>
</html>
`

writeFileSync(join(distPath, 'index.html'), indexHtml)

console.log('✅ Build completed successfully!')
console.log(`📁 Output: ${distPath}`)
console.log(`📦 JS: ${mainJsFileName}`)
console.log(`🎨 CSS: ${cssFileName}`)
