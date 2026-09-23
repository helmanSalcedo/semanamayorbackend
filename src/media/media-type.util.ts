import { MediaType } from '@prisma/client';

const MIME_PREFIX_TO_TYPE: Record<string, MediaType> = {
  image: MediaType.IMAGE,
  video: MediaType.VIDEO,
  audio: MediaType.AUDIO,
};

const EXACT_MIME_TO_TYPE: Record<string, MediaType> = {
  'application/pdf': MediaType.DOCUMENT,
};

/** Returns null for anything outside the platform's supported media kinds. */
export function resolveMediaType(mimeType: string): MediaType | null {
  if (EXACT_MIME_TO_TYPE[mimeType]) {
    return EXACT_MIME_TO_TYPE[mimeType];
  }
  const prefix = mimeType.split('/')[0];
  return MIME_PREFIX_TO_TYPE[prefix] ?? null;
}
