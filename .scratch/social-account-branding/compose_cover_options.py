from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "public" / "brand"
OUT = BRAND / "cover-proofs"
SOURCES = OUT / "sources"

CANVAS = (1800, 600)
IVORY = "#F7F3EC"
INK = "#171719"
AMBER = "#F5A623"
MUTED = "#625F5A"

WORDMARK = BRAND / "approved-z" / "zantap-wordmark-logo2-transparent.png"
MARK = BRAND / "approved-z" / "zantap-z-mark-1024.png"
CUSTOMER = BRAND / "UI-screens" / "Screenshot 2026-07-10 042351.png"
KITCHEN = BRAND / "UI-screens" / "Screenshot 2026-07-10 042559.png"

OPTIONS = [
    (
        SOURCES / "cover-background-option-1.png",
        OUT / "zantap-cover-option-1-warm-flow.png",
        "light",
    ),
    (
        SOURCES / "cover-background-option-2.png",
        OUT / "zantap-cover-option-2-night-signal.png",
        "dark",
    ),
    (
        SOURCES / "cover-background-option-3.png",
        OUT / "zantap-cover-option-3-editorial-arc.png",
        "light",
    ),
]


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = {
        "serif": [Path(r"C:\Windows\Fonts\georgia.ttf")],
        "sans": [Path(r"C:\Windows\Fonts\arial.ttf")],
        "sans-bold": [Path(r"C:\Windows\Fonts\arialbd.ttf")],
    }[name]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def cover_crop(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    source = image.convert("RGBA")
    source_ratio = source.width / source.height
    target_ratio = size[0] / size[1]
    if source_ratio > target_ratio:
        crop_width = int(source.height * target_ratio)
        left = (source.width - crop_width) // 2
        source = source.crop((left, 0, left + crop_width, source.height))
    else:
        crop_height = int(source.width / target_ratio)
        top = (source.height - crop_height) // 2
        source = source.crop((0, top, source.width, top + crop_height))
    return source.resize(size, Image.Resampling.LANCZOS)


def rounded_device(source_path: Path, height: int, border: str) -> Image.Image:
    source = Image.open(source_path).convert("RGBA")
    width = round(source.width * height / source.height)
    source = source.resize((width, height), Image.Resampling.LANCZOS)

    padding = 12
    framed_size = (width + padding * 2, height + padding * 2)
    shadow = Image.new("RGBA", (framed_size[0] + 28, framed_size[1] + 32))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (14, 10, framed_size[0] + 14, framed_size[1] + 10),
        radius=44,
        fill=(0, 0, 0, 175),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))

    device = Image.new("RGBA", shadow.size)
    device.alpha_composite(shadow)
    device_draw = ImageDraw.Draw(device)
    frame_box = (14, 4, framed_size[0] + 14, framed_size[1] + 4)
    device_draw.rounded_rectangle(
        frame_box,
        radius=42,
        fill="#08080A",
        outline=border,
        width=4,
    )

    mask = Image.new("L", source.size)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, source.width - 1, source.height - 1),
        radius=30,
        fill=255,
    )
    device.paste(source, (14 + padding, 4 + padding), mask)
    return device


def paste_scaled(base: Image.Image, image_path: Path, box: tuple[int, int, int, int]) -> None:
    image = Image.open(image_path).convert("RGBA")
    max_width = box[2] - box[0]
    max_height = box[3] - box[1]
    scale = min(max_width / image.width, max_height / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    base.alpha_composite(resized, (box[0], box[1]))


def paste_brand_lockup(base: Image.Image) -> None:
    mark = Image.open(MARK).convert("RGBA")
    alpha_box = mark.getbbox()
    if alpha_box:
        mark = mark.crop(alpha_box)
    mark.thumbnail((112, 112), Image.Resampling.LANCZOS)
    base.alpha_composite(mark, (78, 54))
    paste_scaled(base, WORDMARK, (202, 69, 550, 159))


def make_cover(
    background_path: Path,
    output_path: Path,
    theme: str,
    *,
    headline: str = "Order simply. Serve smoothly.",
    support: str = "From customer tap to kitchen flow.",
    pill_label: str = "BUILT FOR KIGALI FOOD BUSINESSES",
    headline_size: int = 55,
    customer_x: int = 1000,
    kitchen_x: int = 1307,
) -> None:
    cover = cover_crop(Image.open(background_path), CANVAS)
    draw = ImageDraw.Draw(cover, "RGBA")

    if theme == "dark":
        draw.rounded_rectangle(
            (58, 44, 585, 183),
            radius=28,
            fill=(247, 243, 236, 238),
            outline=(245, 166, 35, 120),
            width=2,
        )
        paste_brand_lockup(cover)
        headline_color = IVORY
        support_color = "#D8D3CB"
        pill_text = INK
    else:
        paste_brand_lockup(cover)
        headline_color = INK
        support_color = MUTED
        pill_text = INK

    headline_font = font("serif", headline_size)
    support_font = font("sans", 25)
    pill_font = font("sans-bold", 17)

    draw.text(
        (82, 215),
        headline,
        font=headline_font,
        fill=headline_color,
    )
    draw.text(
        (84, 298),
        support,
        font=support_font,
        fill=support_color,
    )

    pill = (82, 365, 500, 420)
    draw.rounded_rectangle(pill, radius=28, fill=AMBER)
    label = pill_label
    label_box = draw.textbbox((0, 0), label, font=pill_font)
    label_width = label_box[2] - label_box[0]
    draw.text(
        (pill[0] + (pill[2] - pill[0] - label_width) / 2, 382),
        label,
        font=pill_font,
        fill=pill_text,
    )

    customer_device = rounded_device(CUSTOMER, 500, AMBER)
    kitchen_device = rounded_device(KITCHEN, 500, "#3A3A3F")
    cover.alpha_composite(customer_device, (customer_x, 40))
    cover.alpha_composite(kitchen_device, (kitchen_x, 40))

    cover.save(output_path, "PNG", optimize=True)


def make_approval_sheet(paths: list[Path]) -> None:
    width = 1400
    preview_width = 1320
    preview_height = 440
    top = 92
    label_height = 52
    gap = 58
    height = (
        top
        + len(paths) * (label_height + preview_height)
        + (len(paths) - 1) * gap
        + 60
    )
    sheet = Image.new("RGB", (width, height), "#EEEAE3")
    draw = ImageDraw.Draw(sheet)
    draw.text((40, 25), "ZanTap cover directions", font=font("sans-bold", 34), fill=INK)

    labels = [
        "OPTION 1 — WARM FLOW",
        "OPTION 2 — NIGHT SIGNAL",
        "OPTION 3 — EDITORIAL ARC",
    ]
    y = top
    for path, label in zip(paths, labels):
        draw.rounded_rectangle(
            (40, y, 390, y + 40),
            radius=20,
            fill=(14, 14, 16),
        )
        draw.text((60, y + 11), label, font=font("sans-bold", 17), fill=IVORY)
        y += label_height
        preview = Image.open(path).convert("RGB").resize(
            (preview_width, preview_height), Image.Resampling.LANCZOS
        )
        sheet.paste(preview, (40, y))
        y += preview_height + gap

    sheet.save(OUT / "zantap-cover-options-approval-sheet.png", "PNG", optimize=True)


def main() -> None:
    outputs: list[Path] = []
    for background, output, theme in OPTIONS:
        make_cover(background, output, theme)
        outputs.append(output)

    revised_output = OUT / "zantap-cover-option-3-rev-b-tap-serve-grow.png"
    make_cover(
        SOURCES / "cover-background-option-3-rev-b.png",
        revised_output,
        "light",
        headline="Tap. Serve. Grow.",
        support="One smooth flow—from every order to every kitchen.",
        pill_label="ORDER  •  KITCHEN  •  MOMENTUM",
        headline_size=70,
        customer_x=1055,
        kitchen_x=1360,
    )
    make_approval_sheet(outputs)
    for output in outputs:
        print(output)
    print(revised_output)
    print(OUT / "zantap-cover-options-approval-sheet.png")


if __name__ == "__main__":
    main()
