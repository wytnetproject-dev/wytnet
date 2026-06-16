import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { getR2Config, uploadFileToR2 } from "./r2Service";

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  primaryColor: string;
  maxSizeMB?: number;
  autoResetAfterUpload?: boolean;
  isSandbox?: boolean;
}

export default function ImageUploader({
  label,
  value,
  onChange,
  primaryColor,
  maxSizeMB = 5,
  autoResetAfterUpload = false,
  isSandbox = false,
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!value) {
      setFile(null);
      setProgress(0);
      setUploadSuccess(false);
      setUploadError(null);
    }
  }, [value]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setUploadError(null);
    setUploadSuccess(false);

    if (!selectedFile.type.startsWith("image/")) {
      setUploadError("Only image files (PNG, JPG, SVG, WebP, etc.) are allowed.");
      return;
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setUploadError(`File size exceeds the limit of ${maxSizeMB}MB.`);
      return;
    }

    setFile(selectedFile);
    // Auto-upload file
    if (isSandbox) {
      handleSimulateSandbox(selectedFile);
    } else {
      handleUpload(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (fileToUpload?: File) => {
    const targetFile = (fileToUpload instanceof File) ? fileToUpload : file;
    if (!targetFile) return;

    setIsUploading(true);
    setProgress(0);
    setUploadError(null);

    try {
      const activeConfig = getR2Config();
      const fileUrl = await uploadFileToR2(targetFile, activeConfig, (p) => {
        setProgress(p);
      });

      setUploadSuccess(true);
      onChange(fileUrl);
      if (autoResetAfterUpload) {
        setFile(null);
        setProgress(0);
        setUploadSuccess(false);
        setUploadError(null);
      }
    } catch (err: any) {
      console.error("Upload error details:", err);
      // Give a highly descriptive error, noting CORS and permissions
      let message = err.message || "Failed to upload file.";
      if (err.name === "TypeError" && message.includes("Failed to fetch")) {
        message = "Network error (CORS block). Please verify your R2 bucket CORS settings or verify if the bucket exists.";
      } else if (err.name === "AccessDenied") {
        message = "Access Denied. Ensure your API keys have PutObject permissions for the bucket.";
      }
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSimulateSandbox = (fileToSimulate?: File) => {
    const targetFile = (fileToSimulate instanceof File) ? fileToSimulate : file;
    if (!targetFile) return;

    setIsUploading(true);
    setProgress(0);
    setUploadError(null);

    // Simulate upload delay
    let current = 0;
    const interval = setInterval(() => {
      current += 25;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setUploadSuccess(true);
        // Create a local blob URL
        const mockUrl = URL.createObjectURL(targetFile);
        onChange(mockUrl);
        if (autoResetAfterUpload) {
          setFile(null);
          setProgress(0);
          setUploadSuccess(false);
          setUploadError(null);
        }
      }
    }, 30);
  };

  const handleRemove = () => {
    setFile(null);
    setProgress(0);
    setUploadSuccess(false);
    setUploadError(null);
  };

  return (
    <Box className="flex flex-col space-y-2.5 w-full">
      {/* Label and configuration button bar */}
      <Box className="flex justify-between items-center px-1">
        <Typography className="text-slate-600 font-bold text-xs">
          {label}
        </Typography>

        <Box className="flex items-center gap-1">
          {value && (
            <Tooltip title="Clear selection">
              <IconButton
                size="small"
                onClick={() => onChange("")}
                className="text-rose-400 hover:text-rose-600 transition-colors p-1"
              >
                <X className="h-3.5 w-3.5" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Main dropzone / preview area */}
      <Box
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={!file && !value ? handleButtonClick : undefined}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 min-h-[140px] flex flex-col items-center justify-center p-5 select-none bg-white/70 backdrop-blur-[4px] ${
          dragActive
            ? "border-[#0066cc] bg-blue-50/30 scale-[1.01]"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
        } ${!file && !value ? "cursor-pointer" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {/* 1. Preview Current Value (existing remote URL) */}
        {value && !file && (
          <Box className="w-full flex flex-col items-center justify-center space-y-3">
            <div className="relative group max-w-[240px] max-h-[100px] overflow-hidden rounded-xl border border-slate-200/60 shadow-sm bg-slate-50">
              <img
                src={value}
                alt="Uploaded preview"
                className="object-contain w-full h-full max-h-[100px] transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/150x80?text=Preview+Unavailable";
                }}
              />
            </div>
            <Box className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-200/20 max-w-full">
              <ImageIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <Typography className="text-[10px] font-bold text-slate-500 truncate max-w-[180px] font-mono">
                {value}
              </Typography>
              <Tooltip title="View original image">
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Tooltip>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={handleButtonClick}
              sx={{
                borderColor: "#e2e8f0",
                color: "#64748b",
                borderRadius: "8px",
                textTransform: "none",
                fontSize: "10px",
                fontWeight: "bold",
                py: 0.5,
                "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
              }}
            >
              Replace Image
            </Button>
          </Box>
        )}

        {/* 2. Drag & Drop Helper (Idle state) */}
        {!file && !value && (
          <Box className="flex flex-col items-center justify-center text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 transform transition-all duration-300 hover:scale-105 hover:bg-slate-200/80">
              <UploadCloud className="h-5.5 w-5.5" />
            </div>
            <div>
              <Typography className="text-[12.5px] font-bold text-slate-700">
                Drag and drop your file here, or{" "}
                <span style={{ color: primaryColor }} className="hover:underline">
                  browse
                </span>
              </Typography>
              <Typography className="text-[10px] text-slate-400 font-semibold mt-0.5">
                PNG, JPG, WebP or SVG up to {maxSizeMB}MB
              </Typography>
            </div>
          </Box>
        )}

        {/* 3. Selected File (Stage to Upload state) */}
        {file && (
          <Box className="w-full flex flex-col space-y-3.5">
            {/* File info card */}
            <Box className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/50 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                {file.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Selected"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <Typography className="text-[12px] font-bold text-slate-700 truncate">
                  {file.name}
                </Typography>
                <Typography className="text-[10px] text-slate-400 font-semibold">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Uploading...
                </Typography>
              </div>
              {!isUploading && (
                <IconButton
                  size="small"
                  onClick={handleRemove}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <X className="h-4 w-4" />
                </IconButton>
              )}
            </Box>

            {/* Upload progress indicator */}
            {isUploading && (
              <Box className="space-y-1.5 px-1">
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 5,
                    borderRadius: 2.5,
                    bgcolor: "#e2e8f0",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: primaryColor,
                      borderRadius: 2.5,
                    },
                  }}
                />
                <Box className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Uploading to Cloudflare R2...</span>
                  <span>{progress}%</span>
                </Box>
              </Box>
            )}

            {/* Error messaging and sandbox upload actions */}
            {uploadError && (
              <Box className="space-y-2">
                <Alert
                  severity="error"
                  icon={<AlertTriangle className="h-4 w-4 shrink-0" />}
                  sx={{
                    borderRadius: "12px",
                    fontSize: "11px",
                    lineHeight: 1.4,
                    py: 0.5,
                  }}
                >
                  {uploadError}
                </Alert>
              </Box>
            )}

            {/* Success messaging */}
            {uploadSuccess && (
              <Alert
                severity="success"
                icon={<CheckCircle2 className="h-4 w-4 shrink-0" />}
                sx={{
                  borderRadius: "12px",
                  fontSize: "11.5px",
                  py: 0.5,
                }}
              >
                Upload successful!
              </Alert>
            )}

            {/* Actions panel */}
            {!isUploading && !uploadSuccess && (
              <Box className="flex gap-2">
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleUpload()}
                  fullWidth
                  sx={{
                    bgcolor: primaryColor,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: "bold",
                    fontSize: "11.5px",
                    py: 0.75,
                    boxShadow: "none",
                    "&:hover": { bgcolor: primaryColor, opacity: 0.9, boxShadow: "none" },
                  }}
                >
                  Retry Upload
                </Button>

                {uploadError && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={() => handleSimulateSandbox()}
                    fullWidth
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: "bold",
                      fontSize: "11.5px",
                      py: 0.75,
                    }}
                  >
                    Simulate Sandbox Success
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
