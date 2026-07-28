"""BookBunny Video Service - Generate animated book videos"""
import json
import sys
import base64
import os
import tempfile
import subprocess
from pathlib import Path

# Try to use ffmpeg
HAVE_FFMPEG = False
try:
    subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
    HAVE_FFMPEG = True
except (subprocess.CalledProcessError, FileNotFoundError):
    pass


def generate_video(book_data: dict, output_path: str) -> str:
    """Generate an animated video from book pages using FFmpeg"""
    pages = book_data.get("pages", [])
    title = book_data.get("title", "My Story")

    if not HAVE_FFMPEG:
        # Return a playlist HTML as fallback
        html = generate_video_playlist(book_data)
        html_path = output_path.replace('.mp4', '.html')
        with open(html_path, 'w') as f:
            f.write(html)
        return html_path

    # Create temp dir for frame images
    with tempfile.TemporaryDirectory() as tmpdir:
        # Generate a colored frame for each page using ImageMagick or Python
        frame_paths = []
        for i, page in enumerate(pages):
            text = page.get("text", "") if isinstance(page, dict) else page
            frame_path = os.path.join(tmpdir, f"frame_{i:04d}.png")
            generate_frame(text, i + 1, len(pages), frame_path)
            frame_paths.append(frame_path)

        # Use FFmpeg to stitch frames into video
        # 2 seconds per page, 24fps, fade transitions
        input_list = os.path.join(tmpdir, "input.txt")
        with open(input_list, 'w') as f:
            for fp in frame_paths:
                f.write(f"file '{fp}'\n")
                f.write(f"duration 2\n")
            # Last frame needs extra entry
            f.write(f"file '{frame_paths[-1]}'\n")

        cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', input_list,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-r', '24',
            '-vf', 'fps=24,format=yuv420p',
            output_path
        ]
        subprocess.run(cmd, capture_output=True, check=True)

    return output_path


def generate_frame(text: str, page_num: int, total_pages: int, output_path: str):
    """Generate a single video frame using PIL"""
    from PIL import Image, ImageDraw, ImageFont
    import math

    size = (1080, 1080)
    img = Image.new('RGB', size, '#FFF5EE')
    draw = ImageDraw.Draw(img)

    # Try to load a font
    font_size = 36
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', font_size)
    except:
        font = ImageFont.load_default()

    # Draw decorative elements (simplified)
    # Top gradient bar
    for y in range(20):
        color_val = int(255 - y * 3)
        draw.rectangle([0, y, 1080, y], fill=(255, 107, 138, color_val) if y < 20 else None)

    # Page text - word wrap
    words = text.split()
    lines = []
    current_line = []
    for word in words:
        current_line.append(word)
        test_line = ' '.join(current_line)
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] > 900:
            current_line.pop()
            lines.append(' '.join(current_line))
            current_line = [word]
    lines.append(' '.join(current_line))

    # Draw text centered
    total_height = len(lines) * (font_size + 10)
    start_y = (1080 - total_height) // 2
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        x = (1080 - bbox[2]) // 2
        y = start_y + i * (font_size + 10)
        draw.text((x, y), line, fill='#2D2D2D', font=font)

    # Page number
    page_text = f"{page_num} / {total_pages}"
    draw.text((980, 1040), page_text, fill='#C8A2E8', font=font)

    img.save(output_path, 'PNG')


def generate_video_playlist(book_data: dict) -> str:
    """Generate an HTML page that works as a video-like slideshow (fallback)"""
    pages = book_data.get("pages", [])
    title = book_data.get("title", "My Story")

    items_html = ""
    for i, page in enumerate(pages):
        text = page.get("text", "") if isinstance(page, dict) else page
        items_html += f"""
        <div class="slide" data-index="{i}">
            <div class="slide-content">
                <div class="page-num">{i+1}</div>
                <p class="slide-text">{text}</p>
            </div>
        </div>"""

    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{title} - Video</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ background: #1a1a2e; display: flex; justify-content: center; align-items: center;
          min-height: 100vh; font-family: Inter, sans-serif; }}
  .player {{ width: 720px; height: 720px; position: relative; background: #FFF5EE;
             border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }}
  .slide {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.8s; padding: 60px; }}
  .slide.active {{ opacity: 1; }}
  .slide-content {{ text-align: center; }}
  .slide-text {{ font-size: 24pt; color: #2D2D2D; line-height: 1.6; }}
  .page-num {{ font-size: 14pt; color: #C8A2E8; margin-bottom: 30px; }}
  .controls {{ margin-top: 20px; text-align: center; }}
  button {{ background: #FF6B8A; color: white; border: none; padding: 10px 24px;
            border-radius: 12px; font-size: 16px; cursor: pointer; margin: 0 5px; }}
</style></head><body>
<div>
  <div class="player" id="player">{items_html}</div>
  <div class="controls">
    <button onclick="prevSlide()">◀ Prev</button>
    <button onclick="togglePlay()">▶ Play</button>
    <button onclick="nextSlide()">Next ▶</button>
  </div>
</div>
<script>
  let current = 0; let playing = false; let timer = null;
  const slides = document.querySelectorAll('.slide');
  slides[0].classList.add('active');
  function show(n) {{
    slides.forEach(s => s.classList.remove('active'));
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
  }}
  function nextSlide() {{ show(current + 1); }}
  function prevSlide() {{ show(current - 1); }}
  function togglePlay() {{
    playing = !playing;
    if (playing) {{
      timer = setInterval(nextSlide, 3000);
    }} else {{
      clearInterval(timer);
    }}
  }}
</script>
</body></html>"""


if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r') as f:
            data = json.load(f)
        output = sys.argv[2] if len(sys.argv) > 2 else sys.argv[1].replace('.json', '.mp4')
        result = generate_video(data, output)
        print(json.dumps({"success": True, "path": result}))
    else:
        data = json.load(sys.stdin)
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
            output = generate_video(data, tmp.name)
            with open(output, 'rb') as f:
                b64 = base64.b64encode(f.read()).decode()
            print(json.dumps({"success": True, "video_b64": b64, "path": output}))
