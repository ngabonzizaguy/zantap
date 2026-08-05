from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "public" / "brand"
OUT = BRAND / "cover-proofs" / "platform-exports"
OUT.mkdir(parents=True, exist_ok=True)

BG = BRAND / "cover-proofs" / "sources" / "cover-background-option-3-rev-b.png"
MARK = BRAND / "approved-z" / "zantap-z-mark-1024.png"
WORDMARK = BRAND / "approved-z" / "zantap-wordmark-logo2-transparent.png"
CUSTOMER = BRAND / "UI-screens" / "Screenshot 2026-07-10 042351.png"
KITCHEN = BRAND / "UI-screens" / "Screenshot 2026-07-10 042559.png"

IVORY = "#F7F3EC"
INK = "#171719"
AMBER = "#F5A623"
MUTED = "#625F5A"


def font(filename: str, size: int) -> ImageFont.FreeTypeFont:
    path = Path(r"C:\Windows\Fonts") / filename
    return ImageFont.truetype(str(path), size=size) if path.exists() else ImageFont.load_default()


def cover_crop(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    source = image.convert("RGBA")
    source_ratio = source.width / source.height
    target_ratio = size[0] / size[1]
    if source_ratio > target_ratio:
        width = int(source.height * target_ratio)
        left = (source.width - width) // 2
        source = source.crop((left, 0, left + width, source.height))
    else:
        height = int(source.width / target_ratio)
        top = (source.height - height) // 2
        source = source.crop((0, top, source.width, top + height))
    return source.resize(size, Image.Resampling.LANCZOS)


def edge_only_extension(
    edge_row: Image.Image, height: int, *, seam_at_bottom: bool
) -> Image.Image:
    """Extend one background row without duplicating any foreground object."""
    width = edge_row.width
    extension = Image.new("RGBA", (width, height))
    blur_levels = 16
    variants: list[Image.Image] = []
    for level in range(blur_levels):
        radius = round(level * 72 / (blur_levels - 1))
        variants.append(
            edge_row
            if radius == 0
            else edge_row.filter(ImageFilter.GaussianBlur(radius))
        )

    for y in range(height):
        distance_from_seam = (height - 1 - y) if seam_at_bottom else y
        fraction = distance_from_seam / max(1, height - 1)
        level = min(blur_levels - 1, round(fraction * (blur_levels - 1)))
        extension.paste(variants[level], (0, y))
    return extension


def paste_lockup(base: Image.Image, x: int, y: int, mark_height: int, word_height: int) -> None:
    mark = Image.open(MARK).convert("RGBA")
    bbox = mark.getbbox()
    if bbox:
        mark = mark.crop(bbox)
    mark_width = round(mark.width * mark_height / mark.height)
    mark = mark.resize((mark_width, mark_height), Image.Resampling.LANCZOS)
    base.alpha_composite(mark, (x, y))

    word = Image.open(WORDMARK).convert("RGBA")
    word_width = round(word.width * word_height / word.height)
    word = word.resize((word_width, word_height), Image.Resampling.LANCZOS)
    base.alpha_composite(word, (x + mark_width + 16, y + (mark_height - word_height) // 2))


def rounded_device(source_path: Path, height: int, border: str) -> Image.Image:
    source = Image.open(source_path).convert("RGBA")
    width = round(source.width * height / source.height)
    source = source.resize((width, height), Image.Resampling.LANCZOS)
    padding = 10
    frame_width = width + padding * 2
    frame_height = height + padding * 2
    result = Image.new("RGBA", (frame_width + 22, frame_height + 26))

    shadow = Image.new("RGBA", result.size)
    ImageDraw.Draw(shadow).rounded_rectangle(
        (11, 8, frame_width + 11, frame_height + 8),
        radius=35,
        fill=(0, 0, 0, 170),
    )
    result.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(10)))

    draw = ImageDraw.Draw(result)
    draw.rounded_rectangle(
        (11, 3, frame_width + 11, frame_height + 3),
        radius=34,
        fill="#08080A",
        outline=border,
        width=3,
    )
    mask = Image.new("L", source.size)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, source.width - 1, source.height - 1),
        radius=24,
        fill=255,
    )
    result.paste(source, (11 + padding, 3 + padding), mask)
    return result


def draw_copy(
    canvas: Image.Image,
    x: int,
    headline_y: int,
    support_y: int,
    pill_y: int,
    headline_size: int,
    support_size: int,
    pill_width: int,
) -> None:
    draw = ImageDraw.Draw(canvas)
    draw.text((x, headline_y), "Tap. Serve. Grow.", font=font("georgia.ttf", headline_size), fill=INK)
    draw.text(
        (x + 2, support_y),
        "One smooth flow—from every order to every kitchen.",
        font=font("arial.ttf", support_size),
        fill=MUTED,
    )
    draw.rounded_rectangle((x, pill_y, x + pill_width, pill_y + 46), radius=23, fill=AMBER)
    label = "ORDER  •  KITCHEN  •  MOMENTUM"
    label_font = font("arialbd.ttf", max(13, support_size - 4))
    box = draw.textbbox((0, 0), label, font=label_font)
    draw.text(
        (x + (pill_width - (box[2] - box[0])) / 2, pill_y + 14),
        label,
        font=label_font,
        fill=INK,
    )


def make_x() -> Path:
    canvas = cover_crop(Image.open(BG), (1500, 500))
    paste_lockup(canvas, 62, 66, 88, 67)
    draw_copy(canvas, 62, 172, 246, 308, 57, 20, 375)
    canvas.alpha_composite(rounded_device(CUSTOMER, 380, AMBER), (885, 32))
    canvas.alpha_composite(rounded_device(KITCHEN, 380, "#3A3A3F"), (1165, 32))
    output = OUT / "zantap-x-header-option-3-rev-b-1500x500.png"
    canvas.save(output, "PNG", optimize=True)
    return output


def make_facebook(x_path: Path) -> Path:
    # Facebook displays Page covers at roughly 2.7:1 and horizontally crops a
    # 3:1 X header. Keep the entire X artwork unchanged as one 1500x500 band,
    # adding only 28px edge-row continuations above and below. This avoids any
    # duplicated background layer while preserving both horizontal edges.
    x_image = Image.open(x_path).convert("RGBA")
    pad = 28
    canvas = Image.new("RGBA", (x_image.width, x_image.height + pad * 2))
    top_row = x_image.crop((0, 0, x_image.width, 1))
    bottom_row = x_image.crop((0, x_image.height - 1, x_image.width, x_image.height))
    canvas.alpha_composite(edge_only_extension(top_row, pad, seam_at_bottom=True), (0, 0))
    canvas.alpha_composite(x_image, (0, pad))
    canvas.alpha_composite(
        edge_only_extension(bottom_row, pad, seam_at_bottom=False),
        (0, pad + x_image.height),
    )
    output = OUT / "zantap-facebook-cover-full-x-artwork-1500x556.png"
    canvas.save(output, "PNG", optimize=True)
    return output


def make_placement_proof(x_path: Path, fb_path: Path) -> Path:
    sheet = Image.new("RGB", (1420, 1220), "#EEEAE3")
    draw = ImageDraw.Draw(sheet)
    title_font = font("arialbd.ttf", 34)
    label_font = font("arialbd.ttf", 20)
    note_font = font("arial.ttf", 18)
    draw.text((44, 28), "ZanTap cover placement proof", font=title_font, fill=INK)

    # X proof with documented possible 60px top/bottom crop highlighted.
    x_image = Image.open(x_path).convert("RGB").resize((1320, 440), Image.Resampling.LANCZOS)
    x_y = 112
    sheet.paste(x_image, (50, x_y))
    crop = round(60 * 440 / 500)
    overlay = Image.new("RGBA", sheet.size)
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle((50, x_y, 1370, x_y + crop), fill=(14, 14, 16, 105))
    overlay_draw.rectangle((50, x_y + 440 - crop, 1370, x_y + 440), fill=(14, 14, 16, 105))
    overlay_draw.rectangle((50, x_y + crop, 1370, x_y + 440 - crop), outline=AMBER, width=3)
    sheet = Image.alpha_composite(sheet.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(sheet)
    draw.text((64, 72), "X — 1500 × 500", font=label_font, fill=INK)
    draw.text((64, 565), "Amber frame = core safe content; shaded bands may crop.", font=note_font, fill=MUTED)

    # Facebook preserves the complete X band, with only narrow vertical
    # edge-row continuation to satisfy Facebook's live cover aspect ratio.
    fb_image = Image.open(fb_path).convert("RGB").resize((1320, 489), Image.Resampling.LANCZOS)
    fb_x, fb_y = 50, 680
    sheet.paste(fb_image, (fb_x, fb_y))
    draw = ImageDraw.Draw(sheet)
    draw.text((64, 638), "Facebook Page — complete X artwork, 1500 × 556", font=label_font, fill=INK)
    draw.text(
        (64, 1180),
        "Full X band preserved; vertical edge continuation only. No duplicate layer or omitted leaves.",
        font=note_font,
        fill=MUTED,
    )
    output = OUT / "zantap-cover-platform-placement-proof.png"
    sheet.save(output, "PNG", optimize=True)
    return output


def main() -> None:
    x_path = make_x()
    facebook_path = make_facebook(x_path)
    proof_path = make_placement_proof(x_path, facebook_path)
    for path in (x_path, facebook_path, proof_path):
        print(path)


if __name__ == "__main__":
    main()
