"""
Visualize how the alternative hypothesis determines the p-value for a two-proportion z test.

Run with: manim -qm --format=mp4 animations/apstat_611_calculate_pvalue.py CalculatePValue611
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CalculatePValue611(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Find the p-Value", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        hypo_box = RoundedRectangle(
            corner_radius=0.2, width=8.8, height=1.15,
            stroke_color=BLUE_3B1B, stroke_width=4
        ).set_fill(BLUE_3B1B, opacity=0.10)
        hypo_box.shift(UP * 1.55)
        hypo_text = Text("Hₐ: p1 - p2 > 0", font_size=30, color=BLUE_3B1B, weight=BOLD)
        hypo_text.move_to(hypo_box.get_center())

        z_box = RoundedRectangle(
            corner_radius=0.2, width=4.0, height=1.1,
            stroke_color=YELLOW_3B1B, stroke_width=4
        ).set_fill(YELLOW_3B1B, opacity=0.10)
        z_box.shift(LEFT * 3.5 + DOWN * 0.1)
        z_text = VGroup(
            Text("Observed z", font_size=22),
            Text("2.25", font_size=34, color=YELLOW_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.12).move_to(z_box.get_center())

        tail_box = RoundedRectangle(
            corner_radius=0.2, width=6.5, height=1.1,
            stroke_color=TEAL_3B1B, stroke_width=4
        ).set_fill(TEAL_3B1B, opacity=0.10)
        tail_box.shift(RIGHT * 2.5 + DOWN * 0.1)
        tail_text = VGroup(
            Text("Use the right tail", font_size=24, color=WHITE),
            Text("P(Z ≥ 2.25)", font_size=30, color=TEAL_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.10).move_to(tail_box.get_center())

        arrow = Arrow(
            z_box.get_right(), tail_box.get_left(),
            color=GREEN_3B1B, stroke_width=6, buff=0.18
        )

        result_box = RoundedRectangle(
            corner_radius=0.2, width=8.8, height=1.3,
            stroke_color=PINK_3B1B, stroke_width=4
        ).set_fill(PINK_3B1B, opacity=0.10)
        result_box.shift(DOWN * 2.0)
        result_text = VGroup(
            Text("Table A or technology gives", font_size=24),
            Text("p-value = 0.0122", font_size=34, color=PINK_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.12).move_to(result_box.get_center())

        note = Text(
            "One-sided test -> one tail. Two-sided test -> double the tail area.",
            font_size=24,
            color=GREEN_3B1B,
            weight=BOLD,
        )
        note.next_to(result_box, DOWN, buff=0.35)

        self.play(FadeIn(title, shift=DOWN))
        self.play(Create(hypo_box), Write(hypo_text))
        self.play(Create(z_box), FadeIn(z_text, shift=UP * 0.2))
        self.play(Create(tail_box), FadeIn(tail_text, shift=UP * 0.2))
        self.play(GrowArrow(arrow))
        self.play(Create(result_box), FadeIn(result_text, shift=UP * 0.2))
        self.play(FadeIn(note, shift=UP * 0.2))
        self.wait(2)
