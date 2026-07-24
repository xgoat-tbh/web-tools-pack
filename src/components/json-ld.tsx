import { Tool } from "@/lib/tools-config"

export function JsonLd({ tool }: { tool: Tool }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": `${tool.name} - ToolHex`,
    "description": tool.description,
    "url": `https://toolhex.vercel.app/tools/${tool.category}/${tool.slug}`,
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "browserRequirements": "Requires JavaScript. Requires HTML5."
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
