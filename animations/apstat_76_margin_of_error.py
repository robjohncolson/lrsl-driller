"""
Margin of Error for a Difference in Two Means Interval (AP Stats Unit 7, Topic 7.6)

Run with: manim -qm --format=mp4 apstat_76_margin_of_error.py MeanDiffCIMarginOfError
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffCIMarginOfError(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Margin of Error", font_size=42, weight=BOLD)
        subtitle = Text("For μ₁ − μ₂", font_size=28, color=TEAL_3B1B)
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.4)

        general = VGroup(
            Text("ME", font_size=40, color=BLUE_3B1B, weight=BOLD),
            Text("=", font_size=38),
            Text("t*", font_size=40, color=YELLOW_3B1B, weight=BOLD),
            Text("×", font_size=38),
            Text("SE", font_size=40, color=TEAL_3B1B, weight=BOLD),
        ).arrange(RIGHT, buff=0.15)
        general.next_to(subtitle, DOWN, buff=0.7)
        self.play(Write(general), run_time=0.9)
        self.wait(0.8)

        se_box = RoundedRectangle(corner_radius=0.18, width=10.2, height=1.5, stroke_color=TEAL_3B1B, fill_color=TEAL_3B1B, fill_opacity=0.12)
        se_text = Text("SE = sqrt((s₁^2 / n₁) + (s₂^2 / n₂))", font_size=28, color=WHITE).move_to(se_box.get_center())
        se_group = VGroup(se_box, se_text).next_to(general, DOWN, buff=0.7)
        self.play(FadeIn(se_group, shift=UP * 0.2), run_time=0.8)
        self.wait(0.8)

        final_box = RoundedRectangle(corner_radius=0.2, width=11.2, height=1.7, stroke_color=GREEN_3B1B, fill_color=GREEN_3B1B, fill_opacity=0.12)
        final_text = Text(
            "ME = t* × sqrt((s₁^2 / n₁) + (s₂^2 / n₂))",
            font_size=30,
            color=WHITE,
            weight=BOLD,
        ).move_to(final_box.get_center())
        final_group = VGroup(final_box, final_text).next_to(se_group, DOWN, buff=0.8)

        self.play(FadeIn(final_group, shift=UP * 0.2), run_time=1.0)
        self.wait(0.5)

        note = Text("Technology gives the df and the matching t*", font_size=22, color=PINK_3B1B)
        note.next_to(final_group, DOWN, buff=0.35)
        self.play(Write(note), run_time=0.7)
        self.wait(2)
