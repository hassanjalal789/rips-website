// The only inline script on the site. Its SHA-256 hash goes into the content security policy
// (src/_headers.njk), so the two can never drift apart (SRS O-06).
export default {
  js: "document.documentElement.classList.add('js')",
};
