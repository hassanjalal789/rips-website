// News & Events posts: /news/[short-title] (Doc 05 Q22). Only Published posts are built.
export default {
  layout: 'news-post.njk',
  eleventyComputed: {
    permalink: (data) => (data.status === 'Published' ? `/news/${data.slug}/` : false),
    eleventyExcludeFromCollections: (data) => data.status !== 'Published',
    description: (data) => data.summary,
  },
};
