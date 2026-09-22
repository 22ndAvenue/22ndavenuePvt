import { createClient } from '@sanity/client'

import { apiVersion, dataset, projectId } from './env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Serve reads from Sanity's edge CDN (faster TTFB, no API rate pressure).
  // Content edits still land promptly: the Sanity webhook hits /api/revalidate.
  useCdn: true,
})
