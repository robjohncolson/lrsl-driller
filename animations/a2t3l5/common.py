from manim import *

BG = "#F5F1E8"
INK = "#183153"
ACCENT = "#D98924"
POS = "#2C8C5A"
NEG = "#C6532C"
SOFT = "#7AA6C2"
MUTED = "#6B7280"


def setup_scene(scene, title_text):
    scene.camera.background_color = BG
    title = Text(title_text, font_size=40, color=INK)
    title.to_edge(UP)
    scene.play(FadeIn(title, shift=DOWN * 0.2))
    return title


def footer_note(text):
    note = Text(text, font_size=22, color=MUTED)
    note.to_edge(DOWN, buff=0.35)
    return note


def boxed_math(tex, color=ACCENT, font_size=34):
    math = MathTex(tex, font_size=font_size, color=INK)
    box = SurroundingRectangle(math, color=color, buff=0.2, corner_radius=0.12)
    return VGroup(box, math)


def simple_axes(x_range=(-5, 5, 1), y_range=(-4, 4, 1), length=6):
    return Axes(
        x_range=x_range,
        y_range=y_range,
        x_length=length,
        y_length=length * 0.72,
        axis_config={"color": INK, "stroke_width": 2},
        tips=False
    )
