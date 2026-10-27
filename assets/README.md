# YANA source assets

Add the actual YANA logo, drone photographs and videos here. Originals are never modified.

- Logo: a filename containing `logo`, in SVG, PNG, WebP or JPEG format.
- Photos: JPEG, PNG, WebP, AVIF or TIFF. Descriptive filenames are helpful.
- Videos: MP4 or WebM with a browser-compatible codec (H.264 for MP4 recommended).
- Subdirectories are supported. Files with `poster` in the name are reserved as video posters.

Optional: create `media.json` in this directory to select assets, provide accurate alternative text and captions, and attach video posters. Paths are relative to this directory:

```json
{
  "logo": "yana-logo.png",
  "hero": "drone-front.jpg",
  "product": "drone-top.jpg",
  "items": [
    {
      "file": "drone-front.jpg",
      "alt": "YANA educational quadcopter viewed from the front",
      "caption": "A closer look at the quadcopter"
    },
    {
      "file": "demonstration.mp4",
      "caption": "Quadcopter demonstration",
      "poster": "demonstration-poster.jpg",
      "captions": "demonstration.en.vtt",
      "transcript": "An accurate description of what the clip shows and says."
    }
  ]
}
```

When `items` is provided it defines the gallery order and selection. Otherwise all supported photos and videos are included, sorted by filename. `hero` and `product` must refer to images. Add accurate captions and a WebVTT captions file for video containing speech or meaningful sound. A transcript/visual description can be provided for any video. Silent video can use a description without a caption track.
