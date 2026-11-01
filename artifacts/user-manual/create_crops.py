from pathlib import Path
from PIL import Image

assets = Path(r"C:\dev\bpkihs-alumni\artifacts\user-manual\assets")

# Use the visible, top-of-page portion of each live capture in the manual. The full captures
# remain beside these assets, while the crops stay readable at a sensible print size.
for source, target, height in [
    ("about-page.png", "about-page-manual.png", 1050),
    ("community-page.png", "community-page-manual.png", 1050),
    ("member-account.png", "member-account-manual.png", 1050),
    ("donate-page.png", "donate-page-manual.png", 1050),
    ("admin-dashboard.png", "admin-dashboard-manual.png", 1100),
]:
    image = Image.open(assets / source).convert("RGB")
    image.crop((0, 0, image.width, min(height, image.height))).save(assets / target, quality=92)
