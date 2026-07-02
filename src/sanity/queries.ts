import groq from 'groq'

export const heroQuery = groq`*[_type == "hero"] | order(_updatedAt desc)[0] {
  "desktopVideoUrl": coalesce(desktopVideoUrl, desktopVideo.asset->url),
  "mobileVideoUrl": coalesce(mobileVideoUrl, mobileVideo.asset->url),
  "fallbackImage": fallbackImage.asset->url
}`

export const aboutQuery = groq`*[_type == "about"] | order(_updatedAt desc)[0] {
  "directors": directors[] {
    name,
    title,
    "image": image.asset->url + "?w=800&h=1000&fit=crop&auto=format&q=80&fm=webp"
  },
  story
}`

export const collabsQuery = groq`*[_type == "collabs"] | order(_updatedAt desc)[0] {
  "artists": artists[] {
    name,
    link,
    image
  }
}`

export const momentsQuery = groq`*[_type == "moments"] | order(_updatedAt desc)[0] {
  "categories": categories[] {
    categoryName,
    "tiles": tiles[] {
      title,
      subtitle,
      "imageUrl": imageUrl,
      "imageAsset": placeholderImage.asset->url,
      "mobileImageUrl": mobileImageUrl,
      "mobileImageAsset": mobileImage.asset->url,
      "videoUrl": videoUrl,
      "videoAsset": video.asset->url,
      "mobileVideoUrl": mobileVideoUrl,
      "mobileVideoAsset": mobileVideo.asset->url
    }
  }
}`

export const testimonialsQuery = groq`*[_type == "testimonials"] | order(_updatedAt desc)[0] {
  "buzzList": buzzList[] {
    authorName,
    authorTitle,
    authorImage,
    hasVideo,
    "videoUrl": coalesce(videoUrl, videoFile.asset->url),
    text
  }
}`

export const servicesQuery = groq`*[_type == "services"] | order(_updatedAt desc)[0] {
  "servicesList": servicesList[] {
    title,
    enableGallery,
    description,
    "image": select(defined(image.asset) => image.asset->url + "?w=900&h=600&fit=crop&auto=format&q=80&fm=webp"),
    shape,
    bulkVideoUrls,
    "gallery": gallery[] {
      type,
      "image": select(defined(image.asset) => image.asset->url + "?w=1200&auto=format&q=80&fm=webp"),
      "videoUrl": coalesce(videoUrl, videoFile.asset->url),
      "thumbnail": select(defined(thumbnail.asset) => thumbnail.asset->url + "?w=800&h=450&fit=crop&auto=format&q=80&fm=webp")
    }
  }
}`

export const footprintQuery = groq`*[_type == "footprint"] | order(_updatedAt desc)[0] {
  "image": image.asset->url + "?w=1400&auto=format&q=75&fm=webp"
}`

export const showrunnersQuery = groq`*[_type == "showrunners"] | order(_updatedAt desc)[0] {
  title,
  subCopy,
  "teamList": teamList[] {
    name,
    role,
    image,
    bio
  }
}`

export const statsQuery = groq`*[_type == "stats"] | order(_updatedAt desc)[0] {
  "statsList": statsList[] {
    value,
    label
  }
}`
