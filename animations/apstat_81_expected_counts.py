"""
Expected counts for a fair categorical model.

Render:
manim -qm --format=mp4 animations/apstat_81_expected_counts.py ExpectedCountsFairDie
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ExpectedCountsFairDie(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Expected Counts for a Fair Die", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Use total observations divided by equally likely outcomes",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        total_box = RoundedRectangle(
            corner_radius=0.2,
            width=3.2,
            height=1.6,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        total_box.set_fill(BLUE_3B1B, opacity=0.12)
        total_box.shift(LEFT * 3.8 + UP * 0.45)
        total_text = VGroup(
            Text("Total Rolls", font_size=24, color=BLUE_3B1B, weight=BOLD),
            Text("100", font_size=30, weight=BOLD),
        ).arrange(DOWN, buff=0.12).move_to(total_box.get_center())

        face_box = RoundedRectangle(
            corner_radius=0.2,
            width=3.2,
            height=1.6,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        face_box.set_fill(TEAL_3B1B, opacity=0.12)
        face_box.shift(RIGHT * 3.8 + UP * 0.45)
        face_text = VGroup(
            Text("Equal Faces", font_size=24, color=TEAL_3B1B, weight=BOLD),
            Text("10", font_size=30, weight=BOLD),
        ).arrange(DOWN, buff=0.12).move_to(face_box.get_center())

        formula_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.6,
            height=1.5,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        formula_box.set_fill(YELLOW_3B1B, opacity=0.11)
        formula_box.move_to(DOWN * 0.85)
        formula_text = Text("100 ÷ 10 = 10 expected per face", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        formula_text.move_to(formula_box.get_center())

        arrow_left = Arrow(
            total_box.get_bottom(),
            formula_box.get_top() + LEFT * 1.0,
            buff=0.2,
            color=BLUE_3B1B,
            stroke_width=6,
        )
        arrow_right = Arrow(
            face_box.get_bottom(),
            formula_box.get_top() + RIGHT * 1.0,
            buff=0.2,
            color=TEAL_3B1B,
            stroke_width=6,
        )

        chips = VGroup()
        for i in range(10):
            chip = RoundedRectangle(
                corner_radius=0.14,
                width=0.82,
                height=0.58,
                stroke_color=GREEN_3B1B,
                stroke_width=3,
            )
            chip.set_fill(GREEN_3B1B, opacity=0.15)
            label = Text("10", font_size=22, color=GREEN_3B1B, weight=BOLD)
            label.move_to(chip.get_center())
            chips.add(VGroup(chip, label))

        chips.arrange(RIGHT, buff=0.12)
        chips.scale(0.95)
        chips.move_to(DOWN * 2.4)

        chip_caption = Text(
            "Every face starts with the same expected count in the fair model",
            font_size=22,
            color=GREEN_3B1B,
        )
        chip_caption.next_to(chips, UP, buff=0.25)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.5)
        self.play(FadeIn(total_box), Write(total_text), run_time=1.2)
        self.play(FadeIn(face_box), Write(face_text), run_time=1.2)
        self.play(Create(arrow_left), Create(arrow_right), run_time=1.0)
        self.play(Create(formula_box), Write(formula_text), run_time=1.4)
        self.play(FadeIn(chip_caption, shift=UP * 0.15), run_time=0.9)
        self.play(LaggedStart(*[FadeIn(chip, shift=UP * 0.15) for chip in chips], lag_ratio=0.08), run_time=2.0)
        self.wait(2.0)
