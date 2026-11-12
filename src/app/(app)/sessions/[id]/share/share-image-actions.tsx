"use client";

import { useState } from "react";
import { useToast } from "../../../toast-provider";

export function ShareImageActions({
  imageUrl,
  fileName,
}: {
  imageUrl: string;
  fileName: string;
}) {
  const [sharing, setSharing] = useState(false);
  const notify = useToast();

  async function shareImage() {
    setSharing(true);

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Could not load the summary image.");

      const image = new File([await response.blob()], fileName, {
        type: response.headers.get("content-type") || "image/png",
      });

      if (!navigator.share || !navigator.canShare?.({ files: [image] })) {
        notify(
          "Image sharing is not available here. Download the image instead.",
          "info",
        );
        return;
      }

      await navigator.share({ files: [image], title: "Badminton session" });
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      notify(
        reason instanceof Error ? reason.message : "Could not share the image.",
        "error",
      );
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        className="btn btn-sm"
        disabled={sharing}
        onClick={shareImage}
      >
        {sharing ? "Sharing..." : "Share"}
      </button>
      <a href={imageUrl} download={fileName} className="btn btn-sm">
        Save
      </a>
    </div>
  );
}
