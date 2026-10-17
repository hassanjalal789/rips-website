// Program pages: /programs/[short-name] (Doc 05 Q22). Program codes are stable and never reused (Doc 08 Q09).
// Structured data for a course offered by an educational organisation (SRS B-01, Doc 05 Q25): only
// confirmed facts go in: the name, the address of the page and the provider.
export default {
  layout: 'program.njk',
  eleventyComputed: {
    permalink: (data) => `/programs/${data.slug}/`,
    description: (data) =>
      data.description || `${data.title} at RIPS Sheikhupura: duration, eligibility, fees, affiliation and how to enquire.`,
    jsonld: (data) => ({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: data.title,
      url: `${data.settings.url}/programs/${data.slug}/`,
      description: `${data.title} at ${data.settings.name}, ${data.settings.place}.`,
      provider: { '@type': 'EducationalOrganization', name: data.settings.name, url: data.settings.url },
    }),
  },
};
