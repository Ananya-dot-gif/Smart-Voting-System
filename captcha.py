from flask import Blueprint, session, send_file
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random, string, io, os

captcha_bp = Blueprint("captcha_bp", __name__)

# -------------------------
# Generate Random CAPTCHA Text
# -------------------------
def generate_captcha_text(length=5):
    captcha_text = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    session['captcha_text'] = captcha_text  # store in session
    return captcha_text

# -------------------------
# Generate CAPTCHA Image with Disturbances
# -------------------------
def generate_captcha_image(captcha_text):
    width, height = 250, 100
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Load bold font if available
    font_path = os.path.join("fonts", "arial-bold.ttf")
    if os.path.exists(font_path):
        font = ImageFont.truetype(font_path, 60)
    else:
        font = ImageFont.load_default()

    # Draw each character with random rotation and color
    char_x = 15
    for char in captcha_text:
        # Fully opaque letter background
        char_img = Image.new("RGBA", (80, 80), (255, 255, 255, 255))
        char_draw = ImageDraw.Draw(char_img)

        # Random color for each letter
        color = (random.randint(0, 150), random.randint(0, 150), random.randint(0, 150))
        char_draw.text((0, 0), char, font=font, fill=color)

        # Rotate randomly
        rotated = char_img.rotate(random.uniform(-25, 25), expand=1)

        # Paste onto main image at random vertical position
        img.paste(rotated, (int(char_x), random.randint(5, 20)), rotated)
        char_x += 40

    # Add random disturbance lines
    for _ in range(5):
        x1, y1 = random.randint(0, width), random.randint(0, height)
        x2, y2 = random.randint(0, width), random.randint(0, height)
        line_color = (random.randint(100, 200), random.randint(100, 200), random.randint(100, 200))
        draw.line(((x1, y1), (x2, y2)), fill=line_color, width=2)

    # Add random disturbance dots
    for _ in range(150):
        x, y = random.randint(0, width), random.randint(0, height)
        dot_color = (random.randint(0, 150), random.randint(0, 150), random.randint(0, 150))
        draw.point((x, y), fill=dot_color)

    # Slight blur for extra complexity
    img = img.filter(ImageFilter.GaussianBlur(1))

    # Save to buffer
    buf = io.BytesIO()
    img.save(buf, 'PNG')
    buf.seek(0)
    return buf

# -------------------------
# CAPTCHA Route
# -------------------------
@captcha_bp.route("/captcha")
def captcha():
    captcha_text = generate_captcha_text()
    buf = generate_captcha_image(captcha_text)
    return send_file(buf, mimetype="image/png")







