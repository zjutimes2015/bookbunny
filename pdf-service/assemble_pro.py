"""
FFmpeg 合成脚本：Pro 版动画绘本导出

输入：
  - clips/{pageIdx}.mp4        每页动画片段（由 Replicate Wan 3 生成）
  - audio/{pageIdx}.mp3        每页配音（由 Replicate TTS 生成）
  - music.mp3                  配乐轨（由 Replicate MiniMax 生成）
  - cover.jpg                  封面图
  - output.mp4                 输出路径

流程：
  1. 每页：动画片段 + 配音混音（配音音量 1.0，配乐 ducking 到 -20dB）
  2. 页间淡入淡出转场（0.5s）
  3. 封面 3 秒 + 尾页 2 秒
  4. 输出 1080p MP4

用法:
  python pdf-service/assemble_pro.py --book-id <id> --output-dir <dir> [--max-pages <n>]
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Optional


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print(f"  $ {' '.join(cmd)}")
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


def fade_in_out(in_path: Path, out_path: Path, duration: float, fade: float = 0.5):
    """给视频加淡入淡出（首 fade 秒淡入，末 fade 秒淡出）"""
    filter_complex = (
        f"[0:v]fade=t=in:st=0:d={fade},fade=t=out:st={duration - fade}:d={fade}[v];"
        f"[0:a]afade=t=in:st=0:d={fade},afade=t=out:st={duration - fade}:d={fade}[a]"
    )
    run([
        "ffmpeg", "-y", "-i", str(in_path),
        "-filter_complex", filter_complex,
        "-map", "[v]", "-map", "[a]",
        str(out_path),
    ])


def mix_audio(audio_path: Path, music_path: Optional[Path], output_path: Path, music_volume: float = 0.15):
    """配音 + 配乐混音（配乐 ducking）"""
    if not music_path or not music_path.exists():
        run(["ffmpeg", "-y", "-i", str(audio_path), "-c", "copy", str(output_path)])
        return

    # 配乐 ducking：音量压低到 music_volume
    filter_complex = (
        f"[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2:normalize=0"
        f"[mixed];[mixed]volume={music_volume}[final]"
    )
    # 上面逻辑有误，正确做法：配音正常音量，配乐单独压低后混
    filter_complex = (
        f"[1:a]volume=0.15[ducked];"
        f"[0:a][ducked]amix=inputs=2:duration=first:dropout_transition=2[mixed]"
    )
    run([
        "ffmpeg", "-y",
        "-i", str(audio_path),
        "-i", str(music_path),
        "-filter_complex", filter_complex,
        "-map", "[mixed]",
        str(output_path),
    ])


def concat_videos(parts: list[Path], output: Path, total_duration: float):
    """用 concat demuxer 拼接所有片段"""
    list_file = output.with_suffix(".list")
    with open(list_file, "w") as f:
        for p in parts:
            f.write(f"file '{p.resolve()}'\n")
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(list_file),
        "-c", "copy",
        str(output),
    ])
    list_file.unlink(missing_ok=True)


def build_cover_image(cover_path: Path, output_path: Path, duration: float = 3.0):
    """生成封面视频片段（静态图 + 渐入渐出）"""
    if not cover_path.exists():
        # 无封面则用黑屏
        run([
            "ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c=black:s=1920x1080:d={duration}",
            str(output_path),
        ])
        return
    run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(cover_path),
        "-t", str(duration),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
        "-r", "30",
        "-an",
        str(output_path),
    ])


def assemble(
    book_id: str,
    output_dir: Path,
    max_pages: Optional[int] = None,
):
    book_dir = output_dir / book_id
    clips_dir = book_dir / "clips"
    audio_dir = book_dir / "audio"
    captions_dir = book_dir / "captions"
    print_dir = book_dir / "print"
    output_path = book_dir / "animated-pro.mp4"
    music_path = book_dir / "music.mp3"
    cover_path = book_dir / "cover.jpg"

    if not clips_dir.exists():
        print(f"❌ Clips directory not found: {clips_dir}")
        sys.exit(1)

    clip_files = sorted(clips_dir.glob("*.mp4"))
    audio_files = sorted(audio_dir.glob("*.mp3"))
    if max_pages:
        clip_files = clip_files[:max_pages]
        audio_files = audio_files[:max_pages]

    if not clip_files:
        print("❌ No clip files found")
        sys.exit(1)

    print(f"📹 Found {len(clip_files)} clips, {len(audio_files)} audio files")

    # Step 1: 每页混音
    mixed_parts = []
    for i, clip in enumerate(clip_files):
        audio = audio_files[i] if i < len(audio_files) else None
        part = book_dir / f"part-{i:03d}.mp4"

        if audio and audio.exists():
            mixed_audio = book_dir / f"mixed-audio-{i:03d}.mp3"
            mix_audio(audio, music_path, mixed_audio)
            # 视频 + 混音音频合并
            run([
                "ffmpeg", "-y",
                "-i", str(clip),
                "-i", str(mixed_audio),
                "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
                "-shortest",
                str(part),
            ])
            mixed_audio.unlink()
        else:
            # 无配音：复制原视频（静音）
            run(["ffmpeg", "-y", "-i", str(clip), "-c", "copy", str(part)])

        # 淡入淡出
        fade_part = book_dir / f"fade-{i:03d}.mp4"
        fade_in_out(part, fade_part, duration=5.0)
        part.unlink()
        mixed_parts.append(fade_part)

    # Step 2: 拼接所有片段
    concat_output = book_dir / "concat-temp.mp4"
    concat_videos(mixed_parts, concat_output, total_duration=5.0 * len(mixed_parts))

    # Step 3: 封面 + 正片 + 尾页
    cover_video = book_dir / "cover-video.mp4"
    end_video = book_dir / "end-video.mp4"
    build_cover_image(cover_path, cover_video, duration=3.0)
    build_cover_image(cover_path, end_video, duration=2.0)  # 尾页用同一张封面

    # 最终拼接：封面 → 正片 → 尾页
    final_parts = [cover_video, concat_output, end_video]
    list_file = book_dir / "final.list"
    with open(list_file, "w") as f:
        for p in final_parts:
            f.write(f"file '{p.resolve()}'\n")
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(list_file),
        "-c", "copy",
        str(output_path),
    ])
    list_file.unlink()

    # 清理临时文件
    for p in final_parts:
        p.unlink(missing_ok=True)
    concat_output.unlink(missing_ok=True)
    for p in mixed_parts:
        p.unlink(missing_ok=True)

    print(f"✅ Pro animation complete: {output_path}")
    print(f"   Size: {output_path.stat().st_size / 1024 / 1024:.1f} MB")
    return str(output_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Assemble Pro animated book")
    parser.add_argument("--book-id", required=True, help="Book ID")
    parser.add_argument("--output-dir", default="./output", help="Output base directory")
    parser.add_argument("--max-pages", type=int, default=None, help="Max pages to process")
    args = parser.parse_args()

    assemble(args.book_id, Path(args.output_dir), args.max_pages)
