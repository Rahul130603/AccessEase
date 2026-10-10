from PIL import Image, ImageDraw
from pathlib import Path

root = Path(__file__).parent / 'images'
root.mkdir(exist_ok=True)

chart = Image.new('RGB', (360, 160), '#eef5ff')
d = ImageDraw.Draw(chart)
for i, height in enumerate([35, 62, 87, 120]):
    x = 30 + i * 80
    d.rectangle((x, 132 - height, x + 44, 132), fill='#0b4fd8')
    d.text((x + 8, 138), f'Q{i + 1}', fill='#162b58')
chart.save(root / 'chart.png')

for name, text, color in [
    ('decorative', '***', '#b9c9e5'),
    ('contact', 'CONTACT', '#0b4fd8'),
    ('text', 'OPEN 9 AM - 5 PM', '#164b72'),
    ('dynamic', 'NEW', '#3666c9'),
    # Separate URL with identical bytes: the deferred (lazy) fixture must not be
    # confused with the image the dynamic-content button inserts.
    ('deferred', 'NEW', '#3666c9'),
]:
    image = Image.new('RGB', (210, 70), '#edf4ff')
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((8, 8, 202, 62), radius=12, fill=color)
    draw.text((24, 26), text, fill='white')
    image.save(root / f'{name}.png')
