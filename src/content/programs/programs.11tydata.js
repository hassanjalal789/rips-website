// Program pages: /programs/[short-name] (Doc 05 Q22). Program codes are stable and never reused (Doc 08 Q09).
export default {
  layout: 'program.njk',
  eleventyComputed: {
    permalink: (data) => `/programs/${data.slug}/`,
    description: (data) =>
      data.description || `${data.title} at RIPS Sheikhupura: duration, eligibility, fees, affiliation and how to enquire.`,
  },
};
