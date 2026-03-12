"""Batch render Manim animations with explicit ffmpeg path.

Usage:
  python render_batch.py                  # render all missing 720p30
  python render_batch.py --lesson 65      # render only lesson 65
  python render_batch.py --force          # re-render even if mp4 exists
"""

import sys
import os
import glob
import subprocess
from pathlib import Path

FFMPEG = "C:/Users/ColsonR/ffmpeg/bin/ffmpeg.exe"
REPO = "C:/Users/ColsonR/lrsl-driller"
ANIM_DIR = os.path.join(REPO, "animations")
MEDIA_DIR = os.path.join(REPO, "media", "videos")
QUALITY = "-qm"
QUALITY_LABEL = "720p30"

# All lessons with animation source files
LESSONS = ["61", "611", "62", "63", "64", "65", "66", "67", "68", "69", "71", "72"]


def find_sources(lesson):
    pattern = os.path.join(ANIM_DIR, f"apstat_{lesson}_*.py")
    return sorted(glob.glob(pattern))


def has_render(py_file):
    stem = Path(py_file).stem
    out_dir = os.path.join(MEDIA_DIR, stem, QUALITY_LABEL)
    if not os.path.isdir(out_dir):
        return False
    mp4s = [f for f in os.listdir(out_dir) if f.endswith(".mp4")]
    return len(mp4s) > 0


def render_one(py_file):
    """Render a single .py file using a subprocess with ffmpeg configured."""
    wrapper = f"""
import sys
sys.argv = ['manim', 'render', '{QUALITY}', '{py_file.replace(os.sep, "/")}']
from manim._config import config
config.ffmpeg_executable = '{FFMPEG}'
from manim.__main__ import main
main()
"""
    result = subprocess.run(
        [sys.executable, "-c", wrapper],
        cwd=REPO,
        capture_output=True,
        text=True,
    )
    return result


def main():
    args = sys.argv[1:]
    force = "--force" in args
    target_lesson = None
    for i, a in enumerate(args):
        if a == "--lesson" and i + 1 < len(args):
            target_lesson = args[i + 1]

    lessons = [target_lesson] if target_lesson else LESSONS
    total = 0
    rendered = 0
    skipped = 0
    failed = 0

    for lesson in lessons:
        sources = find_sources(lesson)
        if not sources:
            continue
        print(f"\n=== Lesson {lesson}: {len(sources)} source files ===")
        for py_file in sources:
            total += 1
            stem = Path(py_file).stem
            if not force and has_render(py_file):
                print(f"  SKIP {stem} (720p30 exists)")
                skipped += 1
                continue

            print(f"  RENDER {stem} ...", end=" ", flush=True)
            result = render_one(py_file)
            if result.returncode == 0:
                print("OK")
                rendered += 1
            else:
                print("FAIL")
                # Print last few lines of stderr
                lines = result.stderr.strip().split("\n")
                for line in lines[-5:]:
                    print(f"    {line}")
                failed += 1

    print(f"\n{'='*50}")
    print(f"Total: {total} | Rendered: {rendered} | Skipped: {skipped} | Failed: {failed}")


if __name__ == "__main__":
    main()
