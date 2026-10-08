import dotenv from 'dotenv'

import { createApp } from './app.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const port = Number.parseInt(process.env.PORT ?? '3001', 10)
const app = createApp()

app.listen(port, () => {
  console.log(`Butterfly Effect API listening on http://localhost:${port}`)
})
