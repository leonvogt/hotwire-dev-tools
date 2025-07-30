<script>
  import hljs from "highlight.js/lib/core"
  import xml from "highlight.js/lib/languages/xml"
  hljs.registerLanguage("xml", xml)

  const { htmlString } = $props()
</script>

{@html hljs.highlight(htmlString, { language: "html" }).value}
