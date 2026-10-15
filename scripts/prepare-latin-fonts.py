"""Optional: python scripts/prepare-latin-fonts.py (fonttools[woff] required).

Keep original fonts and licenses. Deliver Latin/punctuation WOFF2 subsets for
English titles/UI; Chinese continues to use the separate WenKai fonts.
"""
from pathlib import Path
from fontTools import subset

root = Path(__file__).resolve().parents[1] / "src/assets/fonts"
for name in ["Kalam-Bold", "Nunito-Variable", "InstrumentSerif-Regular"]:
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    font = subset.load_font(str(root / f"{name}.ttf"), options)
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=list(range(0x250)) + list(range(0x1E00, 0x1F00)) + list(range(0x2000, 0x2100)) + list(range(0x2190, 0x2200)))
    worker.subset(font)
    path = root / f"{name}-Latin.woff2"
    subset.save_font(font, str(path), options)
    print(f"{path.name}: {path.stat().st_size:,} bytes")
