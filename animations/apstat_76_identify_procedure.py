"""
Identify the Procedure for a Difference in Two Means (AP Stats Unit 7, Topic 7.6)

Run with: manim -qm --format=mp4 apstat_76_identify_procedure.py MeanDiffCIProcedure
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffCIProcedure(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("2-Sample t-Interval", font_size=42, weight=BOLD)
        subtitle = Text("Difference of Two Means", font_size=26, color=TEAL_3B1B)
        subtitle.next_to(title, DOWN, buff=0.15)
        header = VGroup(title, subtitle).to_edge(UP, buff=0.4)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.5)

        prompts = [
            ("Two groups", BLUE_3B1B),
            ("Quantitative data", YELLOW_3B1B),
            ("Estimate μ₁ − μ₂\nwith an interval", PINK_3B1B),
        ]

        cards = VGroup()
        for text, color in prompts:
            box = RoundedRectangle(corner_radius=0.15, width=3.4, height=1.7, stroke_color=color, fill_color=color, fill_opacity=0.12)
            label = Text(text, font_size=24, color=WHITE).move_to(box.get_center())
            cards.add(VGroup(box, label))

        cards.arrange(RIGHT, buff=0.35).next_to(header, DOWN, buff=0.65)
        self.play(LaggedStart(*[FadeIn(card, shift=UP * 0.2) for card in cards], lag_ratio=0.2))
        self.wait(0.8)

        arrow = Arrow(cards.get_bottom(), DOWN * 0.4, buff=0.2, color=GREEN_3B1B, stroke_width=6)
        answer_box = RoundedRectangle(corner_radius=0.2, width=9.4, height=1.8, stroke_color=GREEN_3B1B, fill_color=GREEN_3B1B, fill_opacity=0.12)
        answer = Text(
            "Use a 2-sample t-interval\nfor the difference in population means",
            font_size=28,
            color=WHITE,
            weight=BOLD,
        ).move_to(answer_box.get_center())
        answer_group = VGroup(answer_box, answer).next_to(cards, DOWN, buff=1.0)
        arrow.put_start_and_end_on(cards.get_bottom() + DOWN * 0.05, answer_group.get_top() + UP * 0.15)

        self.play(Create(arrow), run_time=0.5)
        self.play(FadeIn(answer_group, shift=UP * 0.2), run_time=0.8)
        self.wait(1.5)

        example = Text(
            "Example: female spiders minus male spiders",
            font_size=24,
            color=TEAL_3B1B,
        ).next_to(answer_group, DOWN, buff=0.45)
        self.play(Write(example), run_time=0.7)
        self.wait(2)
