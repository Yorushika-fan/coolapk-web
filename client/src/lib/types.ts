export type EnvelopeResponse<T> = {
  data: T
  message?: string
  status?: number
}

export type FeedItem = {
  id: string
  uid: string
  username: string
  userAvatar: string
  dateline: number
  message: string
  message_title?: string
  pic?: string
  picArr?: string[]
  replynum: number
  likenum: number
  forwardnum?: number
  url?: string
  entityType?: string
  // Coolapk decorates feeds with the device used to post (e.g. "三星Galaxy S25 Edge"),
  // optionally with a deep link to the device's product page.
  device_title?: string
  device_title_url?: string
}

export type Reply = {
  id: string
  uid: string
  username: string
  userAvatar: string
  dateline: number
  message: string
  replynum: number
  likenum: number
  replyRows?: Reply[]
  replyRowsCount?: number
}

export type UserProfile = {
  uid: string
  username: string
  userAvatar: string
  cover?: string
  bio?: string
  feed: number
  follow: number
  fans: number
  level?: number
  astro?: string
  city?: string
  be_like_num?: number
  experience?: number | string
}

export type TagItem = {
  id: string
  title: string
  logo?: string
  followNum?: number
}

// Coolapk's `/v6/topic/newTagDetail` envelope. Tags are sometimes also
// products, so the response is over-documented; we only consume what the
// header card needs.
export type TopicDetail = {
  title: string
  alias_title?: string
  description?: string
  logo?: string
  follow_num?: number
  follow_num_txt?: string
  feed_num?: number
  feed_comment_num?: number
  feed_comment_num_txt?: string
  entityId?: string | number
  entityType?: string
}

export type SearchResult = FeedItem | UserProfile | TagItem
