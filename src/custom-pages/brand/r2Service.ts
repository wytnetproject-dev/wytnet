import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomainUrl?: string; // Optional custom public domain URL
  cfToken?: string; // Cloudflare API Token (cfat_)
}

// Default credentials from environment variables
export const DEFAULT_R2_CONFIG: R2Config = {
  accountId: import.meta.env.VITE_R2_ACCOUNT_ID || "",
  accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || "",
  secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || "",
  bucketName: import.meta.env.VITE_R2_BUCKET_NAME || "",
  cfToken: import.meta.env.VITE_R2_CF_TOKEN || "",
  publicDomainUrl: import.meta.env.VITE_R2_PUBLIC_DOMAIN_URL || "" // Custom domain can be filled by the user, e.g. https://pub-xxx.r2.dev
};

const STORAGE_KEY = "wytnet_r2_uploader_config";

/**
 * Loads R2 uploader configuration from localStorage or returns default credentials.
 */
export function getR2Config(): R2Config {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure basic structure is valid
      if (parsed.accountId && parsed.accessKeyId) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to read R2 config from local storage:", err);
  }
  return DEFAULT_R2_CONFIG;
}

/**
 * Saves R2 configuration to localStorage.
 */
export function saveR2Config(config: R2Config): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error("Failed to save R2 config to local storage:", err);
  }
}

/**
 * Resets configuration to default credentials.
 */
export function resetR2Config(): R2Config {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to reset R2 config:", err);
  }
  return DEFAULT_R2_CONFIG;
}

/**
 * Uploads a file directly to Cloudflare R2 bucket.
 */
export async function uploadFileToR2(
  file: File,
  config: R2Config,
  onProgress?: (progress: number) => void
): Promise<string> {
  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const safeName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_");
  const key = `uploads/${Date.now()}-${safeName}`;

  // Read file as Uint8Array
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  // Since AWS S3 PUT commands are processed in one chunk in browser,
  // we simulate uploading progress to keep the UX smooth.
  if (onProgress) {
    let currentProgress = 10;
    onProgress(currentProgress);
    const interval = setInterval(() => {
      if (currentProgress >= 90) {
        clearInterval(interval);
      } else {
        currentProgress = Math.min(90, currentProgress + 15);
        onProgress(currentProgress);
      }
    }, 100);

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: config.bucketName,
          Key: key,
          Body: uint8Array,
          ContentType: file.type,
        })
      );
      clearInterval(interval);
      onProgress(100);
    } catch (err) {
      clearInterval(interval);
      throw err;
    }
  } else {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: uint8Array,
        ContentType: file.type,
      })
    );
  }

  // Construct URL to return
  if (config.publicDomainUrl && config.publicDomainUrl.trim()) {
    const base = config.publicDomainUrl.trim().replace(/\/$/, "");
    return `${base}/${key}`;
  }

  // Fallback to S3 Endpoint URL (which might require auth, but is the canonical R2 object URL)
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${key}`;
}
