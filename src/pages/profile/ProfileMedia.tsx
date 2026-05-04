import { useState } from "react";

export function ProfileCover({ url }: { url: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = Boolean(url) && failedUrl !== url;
  return (
    <div className="relative h-32 overflow-hidden rounded-t-2xl sm:h-40 md:h-44">
      {showPhoto && url ? (
        <>
          <img
            key={url}
            src={url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            onError={() => setFailedUrl(url)}
          />
          <div
            className="absolute inset-0 bg-linear-to-t from-black/55 via-black/20 to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="h-full w-full bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600"
          aria-hidden
        />
      )}
    </div>
  );
}

export function ProfileAvatarFace({
  url,
  alt,
  initials,
}: {
  url: string | null;
  alt: string;
  initials: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) {
    return <span className="select-none">{initials}</span>;
  }
  return (
    <img
      key={url}
      src={url}
      alt={alt}
      className="h-full w-full object-cover object-center"
      onError={() => setFailedUrl(url)}
      loading="lazy"
    />
  );
}

export function PreviewModalImage({ url, alt }: { url: string | null; alt: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No preview available or image failed to load.
      </p>
    );
  }
  return (
    <img
      key={url}
      src={url}
      alt={alt}
      className="max-h-[70vh] w-full max-w-full rounded-xl object-contain"
      onError={() => setFailedUrl(url)}
    />
  );
}
