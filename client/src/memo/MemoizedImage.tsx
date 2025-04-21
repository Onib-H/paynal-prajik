import { memo } from "react";

export const MemoizedImage = memo(
    ({
        src,
        alt,
        className,
    }: {
        src: string;
        alt: string;
        className: string;
    }) => {
        return <img loading="lazy" src={src} alt={alt} className={className} />;
    }
);

MemoizedImage.displayName = "MemoizedImage";