import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-500.css'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import '@fontsource/nunito/latin-900.css'
import '@fontsource/fredoka/latin-500.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'
// Story Time in Telugu and Hindi. Only the script subsets: the browser downloads
// these files when Telugu or Devanagari text is on screen.
import '@fontsource/noto-sans-telugu/telugu-400.css'
import '@fontsource/noto-sans-telugu/telugu-700.css'
import '@fontsource/noto-sans-telugu/telugu-800.css'
import '@fontsource/noto-sans-devanagari/devanagari-400.css'
import '@fontsource/noto-sans-devanagari/devanagari-700.css'
import '@fontsource/noto-sans-devanagari/devanagari-800.css'
import './index.css'
import { enableNativeStorageMirror } from './services/nativeStorage'

void enableNativeStorageMirror().finally(async () => {
  const { default: App } = await import('./App.tsx')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
