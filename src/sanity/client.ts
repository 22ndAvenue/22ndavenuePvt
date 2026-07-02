import { createClient } from '@sanity/client'

import { apiVersion, dataset, projectId } from './env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Disable CDN caching so changes in Sanity appear immediately.
  useCdn: false,
})
