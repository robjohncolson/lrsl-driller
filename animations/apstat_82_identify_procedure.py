"""
Identify when to use a chi-square goodness-of-fit test.

Render:
manim -qm --format=mp4 animations/apstat_82_identify_procedure.py ChiSquareGoodnessOfFitProcedure
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


def build_card(title_text, body_text, accent_color):
    frame = RoundedRectangle(
        corner_radius=0.18,
        width=3.2,
        height=2.2,
        stroke_color=accent_color,
        stroke_width=4,
    )
    frame.set_fill(accent_color, opacity=0.1)
    title = Text(title_text, font_size=24, color=accent_color, weight=BOLD)
    body = Text(body_text, font_size=20, color=WHITE, line_spacing=0.9)
    body.next_to(title, DOWN, buff=0.18)
    group = VGroup(frame, title, body)
    title.move_to(frame.get_center() + UP * 0.45)
    body.move_to(frame.get_center() + DOWN * 0.35)
    return group


class ChiSquareGoodnessOfFitProcedure(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("When Do We Use χ² GOF?", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Look for one sample, one categorical variable, and a specified distribution",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        card1 = build_card("One Sample", "One random\nsample only", BLUE_3B1B)
        card2 = build_card("One Variable", "Counts from one\ncategorical variable", TEAL_3B1B)
        card3 = build_card("Compare to Model", "Specified proportions\nfrom H₀", PINK_3B1B)
        cards = VGroup(card1, card2, card3).arrange(RIGHT, buff=0.45)
        cards.move_to(UP * 0.45)

        result_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.8,
            height=1.6,
            stroke_color=GREEN_3B1B,
            stroke_width=5,
        )
        result_box.set_fill(GREEN_3B1B, opacity=0.12)
        result_text = Text(
            "Chi-Square Goodness-of-Fit Test",
            font_size=28,
            color=GREEN_3B1B,
            weight=BOLD,
        )
        result_group = VGroup(result_box, result_text)
        result_group.move_to(DOWN * 2.2)

        arrows = VGroup(
            Arrow(card1.get_bottom(), result_group.get_top() + LEFT * 1.8, buff=0.18, color=BLUE_3B1B),
            Arrow(card2.get_bottom(), result_group.get_top(), buff=0.18, color=TEAL_3B1B),
            Arrow(card3.get_bottom(), result_group.get_top() + RIGHT * 1.8, buff=0.18, color=PINK_3B1B),
        )

        footer = Text(
            "Not two samples. Not quantitative data. Not directional.",
            font_size=21,
            color=YELLOW_3B1B,
        )
        footer.move_to(DOWN * 3.35)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.4)
        self.play(LaggedStart(*(FadeIn(card, shift=UP * 0.3) for card in cards), lag_ratio=0.18), run_time=2.2)
        self.wait(0.5)
        self.play(LaggedStart(*(GrowArrow(arrow) for arrow in arrows), lag_ratio=0.18), run_time=1.6)
        self.play(DrawBorderThenFill(result_box), Write(result_text), run_time=1.8)
        self.wait(0.5)
        self.play(
            card1[0].animate.set_fill(BLUE_3B1B, opacity=0.2),
            card2[0].animate.set_fill(TEAL_3B1B, opacity=0.2),
            card3[0].animate.set_fill(PINK_3B1B, opacity=0.2),
            Circumscribe(result_box, color=GREEN_3B1B, time_width=1.4),
            run_time=1.8,
        )
        self.play(FadeIn(footer, shift=UP * 0.2), run_time=1.2)
        self.wait(2.5)
