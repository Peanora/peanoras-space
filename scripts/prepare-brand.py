"""Prepare site icons and a 1200x630 sharing cover from the existing avatar.

Run with Pillow and FontTools[woff] available. Original artwork stays unchanged.
"""
from pathlib import Path
from io import BytesIO
from functools import cache
import argparse
import site

parser = argparse.ArgumentParser()
parser.add_argument("--tools", type=Path)
args = parser.parse_args()
if args.tools:
    site.addsitedir(str(args.tools))
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
fonts = root / "src/assets/fonts"
public = root / "public"

@cache
def chinese_font_bytes():
    font = TTFont(fonts / "LXGWWenKaiLite-Regular.woff2")
    font.flavor = None
    buffer = BytesIO()
    font.save(buffer)
    return buffer.getvalue()

def chinese_font(size):
    return ImageFont.truetype(BytesIO(chinese_font_bytes()), size)

cover = Image.new("RGB", (1200, 630), "#faf6ef")
draw = ImageDraw.Draw(cover)
draw.line((60, 558, 1140, 558), fill="#ded2c3", width=2)
hand = ImageFont.truetype(str(fonts / "Kalam-Bold.ttf"), 100)
round_font = ImageFont.truetype(str(fonts / "Nunito-Variable.ttf"), 23)
draw.text((78, 95), "Peanora's", fill="#493b32", font=hand)
draw.text((115, 215), "Space", fill="#805234", font=hand)
draw.line((87, 345, 200, 342), fill="#d69d64", width=4)
draw.text((83, 377), "欢迎来到我的小空间", font=chinese_font(32), fill="#493b32")
draw.text((83, 442), "个人世界 · 音乐与回忆 · 小角落", font=chinese_font(22), fill="#66584d")
draw.text((83, 578), "peanora.cn", font=round_font, fill="#805234")

avatar = Image.open(root / "src/assets/artwork/web/avatar.webp").convert("RGBA")
avatar = avatar.resize((270, 270), Image.Resampling.LANCZOS)
paper = Image.new("RGBA", (294, 330), "#fffdf8")
paper.alpha_composite(avatar, (12, 12))
ImageDraw.Draw(paper).text((78, 284), "Peanora", font=ImageFont.truetype(str(fonts / "Kalam-Bold.ttf"), 30), fill="#805234")
paper = paper.rotate(-6, expand=True, resample=Image.Resampling.BICUBIC)
shadow = Image.new("RGBA", cover.size)
shadow.paste((88, 63, 40, 42), (794, 152), paper.getchannel("A"))
shadow = shadow.filter(ImageFilter.GaussianBlur(13))
result = Image.alpha_composite(cover.convert("RGBA"), shadow)
result.alpha_composite(paper, (786, 137))
draw = ImageDraw.Draw(result)
draw.ellipse((1080, 100, 1116, 136), outline="#c58d48", width=3)
for a,b in [((1098,82),(1098,92)),((1098,144),(1098,154)),((1062,118),(1072,118)),((1124,118),(1134,118)),((1073,93),(1080,100)),((1116,136),(1123,143)),((1073,143),(1080,136)),((1116,100),(1123,93))]:
    draw.line((a,b), fill="#c58d48", width=3)
result.convert("RGB").save(public / "social-cover.png", optimize=True)

icon = Image.new("RGBA", (256, 256))
draw = ImageDraw.Draw(icon)
draw.rounded_rectangle((0,0,255,255), radius=64, fill="#faf6ef")
draw.line((76,188,76,64), fill="#805234", width=20)
draw.rounded_rectangle((76,64,166,144), radius=32, outline="#805234", width=20)
draw.ellipse((168,172,200,204), fill="#d69d64")
icon.resize((32,32), Image.Resampling.LANCZOS).save(public / "favicon.png")
icon.save(public / "favicon.ico", sizes=[(16,16),(32,32),(48,48)])
icon.resize((180,180), Image.Resampling.LANCZOS).save(public / "apple-touch-icon.png")
print("Prepared icons and social-cover.png from the existing avatar.")
