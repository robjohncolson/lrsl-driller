"""
State the evidence carefully for a two-sample test conclusion.

Render:
manim -qm --format=mp4 animations/apstat_79_state_evidence.py MeanDiffTestEvidence
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

H0 = "H\u2080"
HA = "H\u2090"


class MeanDiffTestEvidence(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("State the Evidence Carefully", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Use evidence language for the alternative claim",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        correct_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.4,
            height=2.8,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        correct_box.set_fill(GREEN_3B1B, opacity=0.12)
        correct_box.shift(UP * 0.35)
        correct_text = VGroup(
            Text("Correct wording pattern", font_size=25, color=GREEN_3B1B, weight=BOLD),
            Text(f"Reject {H0}  ->  convincing statistical evidence for {HA}", font_size=23, weight=BOLD),
            Text(f"Fail to reject {H0}  ->  not convincing statistical evidence for {HA}", font_size=21),
        ).arrange(DOWN, buff=0.16).move_to(correct_box.get_center())

        wrong_left = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=2.0,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        wrong_left.set_fill(PINK_3B1B, opacity=0.12)
        wrong_left.shift(LEFT * 3.0 + DOWN * 2.0)
        wrong_left_text = VGroup(
            Text("Wrong shortcut", font_size=22, color=PINK_3B1B, weight=BOLD),
            Text("Do not say", font_size=21),
            Text("prove with certainty", font_size=22),
        ).arrange(DOWN, buff=0.12).move_to(wrong_left.get_center())

        wrong_right = RoundedRectangle(
            corner_radius=0.2,
            width=4.9,
            height=2.0,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        wrong_right.set_fill(BLUE_3B1B, opacity=0.12)
        wrong_right.shift(RIGHT * 3.0 + DOWN * 2.0)
        wrong_right_text = VGroup(
            Text("Wrong shortcut", font_size=22, color=BLUE_3B1B, weight=BOLD),
            Text("Do not say", font_size=21),
            Text(f"{H0} is true", font_size=22),
        ).arrange(DOWN, buff=0.12).move_to(wrong_right.get_center())

        footer_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.8,
            height=1.05,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        footer_box.set_fill(TEAL_3B1B, opacity=0.12)
        footer_box.to_edge(DOWN, buff=0.35)
        footer = Text(
            "Evidence supports or does not support a claim. It does not deliver certainty.",
            font_size=22,
            color=TEAL_3B1B,
            weight=BOLD,
        )
        footer.move_to(footer_box.get_center())

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.4)
        self.wait(0.9)
        self.play(DrawBorderThenFill(correct_box), Write(correct_text), run_time=1.4)
        self.wait(1.0)
        self.play(FadeIn(wrong_left, shift=UP * 0.2), Write(wrong_left_text), run_time=1.2)
        self.wait(0.9)
        self.play(FadeIn(wrong_right, shift=UP * 0.2), Write(wrong_right_text), run_time=1.2)
        self.wait(1.0)
        self.play(FadeIn(footer_box, shift=UP * 0.2), Write(footer), run_time=1.2)
        self.wait(4.9)
