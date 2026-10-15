"""Create resized WebP delivery copies without changing original artwork.

Optional maintenance script: python scripts/prepare-artwork.py (requires Pillow).
Generated files are committed; normal npm builds do not need Python.
"""
from pathlib import Path
from PIL import Image, ImageOps

source = Path(__file__).resolve().parents[1] / "src/assets/artwork"
target = source / "web"
target.mkdir(exist_ok=True)
original_bytes = delivery_bytes = 0
for original in sorted(source.glob("*.jpg")):
    image = ImageOps.exif_transpose(Image.open(original)).convert("RGB")
    edge = 640 if original.stem == "avatar" else 1920
    image.thumbnail((edge, edge), Image.Resampling.LANCZOS)
    output = target / (original.stem + ".webp")
    image.save(output, "WEBP", quality=84, method=6)
    # Dedicated thumbnails and responsive copies avoid full artwork on phones.
    if original.stem != "avatar":
        for width, quality in [(240, 70), (640, 76), (1080, 80)]:
            variant = image.copy()
            variant.thumbnail((width, width), Image.Resampling.LANCZOS)
            variant.save(target / f"{original.stem}-{width}.webp", "WEBP", quality=quality, method=6)
    original_bytes += original.stat().st_size
    delivery_bytes += output.stat().st_size
    print(f"{output.name}: {image.width}x{image.height}, {output.stat().st_size:,} bytes", flush=True)
print(f"All artwork: {original_bytes:,} -> {delivery_bytes:,} bytes", flush=True)
