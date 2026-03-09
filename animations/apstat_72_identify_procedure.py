"""
Visualize how to identify the correct inference procedure for Topic 7.2.

Run with: manim -qm --format=mp4 animations/apstat_72_identify_procedure.py MeanCIProcedure
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCIProcedure(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Identify the Procedure", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        prompt = Text("What should we use to estimate μ?", font_size=28, color=TEAL_3B1B)
        prompt.next_to(title, DOWN, buff=0.25)

        card_specs = [
            ("One sample", BLUE_3B1B),
            ("Quantitative data", TEAL_3B1B),
            ("Estimate a mean μ", YELLOW_3B1B),
        ]
        cards = VGroup()
        for text, color in card_specs:
            box = RoundedRectangle(
                corner_radius=0.18,
                width=3.4,
                height=1.1,
                stroke_color=color,
                stroke_width=4,
            )
            box.set_fill(color, opacity=0.12)
            label = Text(text, font_size=28, color=color, weight=BOLD)
            label.move_to(box.get_center())
            cards.add(VGroup(box, label))
        cards.arrange(DOWN, buff=0.28)
        cards.shift(LEFT * 3.25 + DOWN * 0.25)

        arrows = VGroup()
        for idx in range(2):
            arrow = Arrow(
                cards[idx].get_bottom(),
                cards[idx + 1].get_top(),
                buff=0.12,
                color=WHITE,
                stroke_width=5,
            )
            arrows.add(arrow)

        answer_box = RoundedRectangle(
            corner_radius=0.2,
            width=6.1,
            height=2.1,
            stroke_color=GREEN_3B1B,
            stroke_width=5,
        )
        answer_box.set_fill(GREEN_3B1B, opacity=0.12)
        answer_box.shift(RIGHT * 3.15 + DOWN * 0.2)

        answer_title = Text("Procedure", font_size=24, color=GREEN_3B1B, weight=BOLD)
        answer_title.move_to(answer_box.get_center() + UP * 0.52)
        answer_line_1 = Text("One-sample t-interval", font_size=30, color=GREEN_3B1B, weight=BOLD)
        answer_line_1.move_to(answer_box.get_center() + UP * 0.05)
        answer_line_2 = Text("for a population mean", font_size=27, color=WHITE)
        answer_line_2.move_to(answer_box.get_center() + DOWN * 0.45)

        wrong_1 = Text("Not a z-interval for p", font_size=24, color=PINK_3B1B)
        wrong_1.next_to(answer_box, DOWN, buff=0.38)
        wrong_2 = Text("Not a significance test", font_size=24, color=PINK_3B1B)
        wrong_2.next_to(wrong_1, DOWN, buff=0.12)

        connector = Arrow(
            cards.get_right() + RIGHT * 0.15,
            answer_box.get_left() + LEFT * 0.12,
            color=YELLOW_3B1B,
            stroke_width=6,
            buff=0.1,
        )

        self.play(Write(title), Write(prompt), run_time=1.0)
        self.play(FadeIn(cards[0]), run_time=0.4)
        self.play(FadeIn(cards[1]), Create(arrows[0]), run_time=0.5)
        self.play(FadeIn(cards[2]), Create(arrows[1]), run_time=0.5)
        self.wait(0.4)
        self.play(Create(connector), Create(answer_box), run_time=0.7)
        self.play(Write(answer_title), Write(answer_line_1), Write(answer_line_2), run_time=1.0)
        self.wait(0.5)

        x_mark_1 = Line(wrong_1.get_left() + LEFT * 0.05, wrong_1.get_right() + RIGHT * 0.05, color=PINK_3B1B, stroke_width=5)
        x_mark_2 = Line(wrong_1.get_left() + RIGHT * 0.05, wrong_1.get_right() + LEFT * 0.05, color=PINK_3B1B, stroke_width=5)
        x_group_1 = VGroup(x_mark_1, x_mark_2)

        x_mark_3 = Line(wrong_2.get_left() + LEFT * 0.05, wrong_2.get_right() + RIGHT * 0.05, color=PINK_3B1B, stroke_width=5)
        x_mark_4 = Line(wrong_2.get_left() + RIGHT * 0.05, wrong_2.get_right() + LEFT * 0.05, color=PINK_3B1B, stroke_width=5)
        x_group_2 = VGroup(x_mark_3, x_mark_4)

        self.play(Write(wrong_1), Create(x_group_1), run_time=0.7)
        self.play(Write(wrong_2), Create(x_group_2), run_time=0.7)
        self.wait(1.8)
