"""
Visualize the three conditions for a one-sample t-interval for a population mean.

Run with: manim -qm --format=mp4 animations/apstat_72_check_conditions.py MeanCIConditions
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCIConditions(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Check the Conditions", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        panels = VGroup()
        panel_data = [
            ("1. Random", "Random sample\nor randomized experiment", BLUE_3B1B),
            ("2. 10% Rule", "When sampling without replacement:\nn ≤ 10% of population", TEAL_3B1B),
            ("3. Shape", "Either n ≥ 30\nor no strong skewness/outliers", YELLOW_3B1B),
        ]

        for header, body, color in panel_data:
            rect = RoundedRectangle(
                corner_radius=0.18,
                width=4.0,
                height=1.85,
                stroke_color=color,
                stroke_width=4,
            )
            rect.set_fill(color, opacity=0.12)
            title_text = Text(header, font_size=28, color=color, weight=BOLD)
            body_text = Text(body, font_size=22, color=WHITE)
            body_text.move_to(rect.get_center() + DOWN * 0.18)
            title_text.move_to(rect.get_center() + UP * 0.52)
            panels.add(VGroup(rect, title_text, body_text))

        panels.arrange(DOWN, buff=0.3)
        panels.shift(LEFT * 3.3 + DOWN * 0.2)

        pass_box = RoundedRectangle(
            corner_radius=0.18,
            width=5.6,
            height=1.7,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        pass_box.set_fill(GREEN_3B1B, opacity=0.12)
        pass_box.shift(RIGHT * 2.9 + UP * 0.35)
        pass_title = Text("Pass Example", font_size=28, color=GREEN_3B1B, weight=BOLD)
        pass_title.move_to(pass_box.get_center() + UP * 0.42)
        pass_text = Text("10 random bags\nn = 10, clean boxplot", font_size=24)
        pass_text.move_to(pass_box.get_center() + DOWN * 0.18)

        fail_box = RoundedRectangle(
            corner_radius=0.18,
            width=5.6,
            height=1.7,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        fail_box.set_fill(PINK_3B1B, opacity=0.12)
        fail_box.shift(RIGHT * 2.9 + DOWN * 1.95)
        fail_title = Text("Fail Example", font_size=28, color=PINK_3B1B, weight=BOLD)
        fail_title.move_to(fail_box.get_center() + UP * 0.42)
        fail_text = Text("6 classmates\nskewed dotplot with outlier", font_size=24)
        fail_text.move_to(fail_box.get_center() + DOWN * 0.18)

        note = Text("All three conditions must hold.", font_size=28, color=WHITE, weight=BOLD)
        note.to_edge(DOWN, buff=0.55)

        self.play(Write(title), run_time=0.8)
        self.play(FadeIn(panels[0]), run_time=0.5)
        self.play(FadeIn(panels[1]), run_time=0.5)
        self.play(FadeIn(panels[2]), run_time=0.5)
        self.wait(0.4)
        self.play(Create(pass_box), Write(pass_title), Write(pass_text), run_time=0.9)

        pass_checks = VGroup(
            Text("✓ random", font_size=24, color=GREEN_3B1B),
            Text("✓ 10% reasonable", font_size=24, color=GREEN_3B1B),
            Text("✓ no strong skew/outliers", font_size=24, color=GREEN_3B1B),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        pass_checks.next_to(pass_box, DOWN, buff=0.18).align_to(pass_box, LEFT)
        self.play(LaggedStart(*[Write(item) for item in pass_checks], lag_ratio=0.25), run_time=1.0)
        self.wait(0.5)

        self.play(Create(fail_box), Write(fail_title), Write(fail_text), run_time=0.9)
        fail_checks = VGroup(
            Text("✗ not random", font_size=24, color=PINK_3B1B),
            Text("✓ 10% reasonable", font_size=24, color=GREEN_3B1B),
            Text("✗ strong skew/outlier", font_size=24, color=PINK_3B1B),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        fail_checks.next_to(fail_box, DOWN, buff=0.18).align_to(fail_box, LEFT)
        self.play(LaggedStart(*[Write(item) for item in fail_checks], lag_ratio=0.25), run_time=1.0)
        self.play(Write(note), run_time=0.6)
        self.wait(1.8)
