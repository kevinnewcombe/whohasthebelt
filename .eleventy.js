const htmlmin = require("html-minifier-terser");
const CleanCSS = require("clean-css");
module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/favicon": "/" });
  // eleventyConfig.addPassthroughCopy({ "src/style.css": "/" });
  eleventyConfig.addFilter("cssmin", function (code) {
		return new CleanCSS({}).minify(code).styles;
	});

  eleventyConfig.setServerOptions({
		showAllHosts: true,
	});

  eleventyConfig.addTransform("htmlmin", function (content) {
		if ((this.page.outputPath || "").endsWith(".html")) {
			let minified = htmlmin.minify(content, {
				useShortDoctype: true,
				removeComments: true,
				collapseWhitespace: true,
			});

			return minified;
		}
		// If not an HTML output, return content as-is
		return content;
	});
  return {
    // When a passthrough file is modified, rebuild the pages:
    passthroughFileCopy: true,
    dir: {
      input: "src",
      data: "_data",
      output: "_site"
    }
  };
  
};


