# Background-removed drone photographs

The originals remain in this directory. The website selects only the two transparent cutouts using `media.json`.

| Original | Edited asset | Website use |
| --- | --- | --- |
| `quadcopter-overview.jpg` | `quadcopter-overview-cutout.png` | Hero, product, first gallery photograph, video preview |
| `drone.jpg` | `drone-detail-cutout.png` | Second gallery photograph |

Method: built-in `image_gen.imagegen`, edit mode, one request per original, `transparent_background: true`. Both outputs were inspected before integration. Responsive WebP exports preserve the alpha channel. These are background-removal edits of supplied photographs, not additional drone products or evidence of new capabilities. The actual video retains its original surroundings.

## Prompt set

Both requests used this shared instruction:

> Use case: background-extraction. Edit target: the single supplied original photograph of the YANA educational quadcopter. Primary request: make a clean transparent-background cutout of the existing drone for its website. STRICT INVARIANTS: this is background removal only, preserve the actual photographed drone's original geometry, components, texture, colours, lighting, orientation, camera angle and perspective. Do not redesign, restyle or replace the drone. Keep holes through the frame and spaces between its arms truly transparent. No propellers are fitted in the source; do not add any. No new components, labels, text, shadows or backdrop. Output real RGBA transparency with clean detailed edges and a small transparent margin around the visible subject.

Overview-specific instruction:

> Remove the supporting human hand and forearm completely along with the room, floral cloth, furniture and workbench. Preserve all four arms and red motors, black and white frame, wiring, central mounted flight controller, long antenna mast and circular puck, precisely as visible. Do not fill in components obscured by the hand; retain the visible drone silhouette and no skin pixels.

Detail-specific instruction:

> Remove the workbench, floral cloth, mobile phone, glue gun, loose cable ties and all surrounding clutter. Preserve only the actual quadcopter including its black and white frame, central copper/black mounting plates with blue fasteners, attached wiring and connectors, red motors, mast and circular black puck. Preserve the original partially cropped lower arms at the borders; do not invent hidden or out-of-frame hardware.
