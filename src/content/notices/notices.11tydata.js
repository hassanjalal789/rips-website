// Notices and merit lists: /notices/[session]-[short-title] (Doc 05 Q22; Doc 08 "Notice").
// Only Published notices whose publish time has passed are built (Doc 05 Q29: drafts never appear).
// Merit lists are never indexed (Doc 05 Q24), nor are notices already taken off the site (SRS D-06).
import { noticeState } from '../../../lib/content-rules.js';

const isLive = (data) => data.status === 'Published' && new Date(data.publish_at) <= data.build.today;

export default {
  layout: 'notice.njk',
  eleventyComputed: {
    permalink: (data) => (isLive(data) ? `/notices/${data.slug}/` : false),
    eleventyExcludeFromCollections: (data) => !isLive(data),
    noindex: (data) => data.type === 'Merit list' || noticeState(data, data.build.today) === 'removed',
    description: (data) => `${data.title}. Published by RIPS Sheikhupura.`,
  },
};
