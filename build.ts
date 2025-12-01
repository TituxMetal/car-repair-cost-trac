import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import tailwind from 'bun-plugin-tailwind'

const projectRoot = import.meta.dirname

// Ensure dist directory exists
const distPath = join(projectRoot, 'dist')
const assetsPath = join(distPath, 'assets')
if (!existsSync(assetsPath)) {
  mkdirSync(assetsPath, { recursive: true })
}

console.log('🔨 Building frontend with Bun...')

// Build JavaScript and CSS with Bun using Tailwind plugin
console.log('📦 Building with Bun and Tailwind...')
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
  plugins: [tailwind]
})

if (!result.success) {
  console.error('❌ Build failed:')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

console.log('✅ Build successful')

// Find the generated entry files
const outputs = result.outputs
const mainEntry = outputs.find(o => o.path.includes('main') && o.path.endsWith('.js'))
const cssEntries = outputs.filter(o => o.path.endsWith('.css'))

if (!mainEntry) {
  console.error('❌ No main JavaScript entry found in build output')
  process.exit(1)
}

const mainJsFileName = mainEntry.path.split('/').pop()!

// Generate CSS links for all CSS files
const cssLinks = cssEntries
  .map(css => {
    const fileName = css.path.split('/').pop()
    if (!fileName) return null
    return `<link href="/assets/${fileName}" rel="stylesheet" />`
  })
  .filter(Boolean)
  .join('\n    ')

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
    ${cssLinks}
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
if (cssEntries.length > 0) {
  console.log(`🎨 CSS: ${cssEntries.map(c => c.path.split('/').pop()).join(', ')}`)
} else {
  console.log('⚠️ No CSS files generated - styles may be inlined or missing')
}
