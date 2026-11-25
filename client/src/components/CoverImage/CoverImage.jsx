export function starText(rating) {
  const full = Math.round(Number(rating) || 0);
  return `${"★".repeat(full)}${"☆".repeat(Math.max(0, 5 - full))}`;
}

export function CoverImage({ src, alt, eager = false }) {
  if (!src) {
    return <div className="cover-fallback" role="img" aria-label={alt} />;
  }
  return (
    <img
      src={src}
      alt={alt}
      width="800"
      height="560"
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
