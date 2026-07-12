export default function WebsiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "3D Hub",
    alternateName: [
      "3DHub",
      "3D Hub Telugu",
    ],
    url: "https://3d-hub-lac.vercel.app",
    description:
      "Telugu movies, music videos, kids videos, 3D videos and immersive audio.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}
