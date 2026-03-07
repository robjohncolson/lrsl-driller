"""
Identify the correct interval procedure for two proportions.

Run with: manim -qm --format=mp4 animations/apstat_68_identify_two_prop_ci.py IdentifyTwoPropCI
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class IdentifyTwoPropCI(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Identify the 6.8 Procedure", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        prompt = Text("Ask three quick questions", font_size=24, color=GREY_B)
        prompt.next_to(title, DOWN, buff=0.2)

        card_specs = [
            ("2 groups", BLUE_3B1B),
            ("categorical outcome", TEAL_3B1B),
            ("confidence interval", YELLOW_3B1B),
        ]

        cards = VGroup()
        texts = VGroup()
        for label, color in card_specs:
            box = RoundedRectangle(corner_radius=0.18, width=3.3, height=1.2, stroke_color=color, stroke_width=4)
            box.set_fill(color, opacity=0.12)
            txt = Text(label, font_size=26, color=color, weight=BOLD)
            txt.move_to(box.get_center())
            cards.add(box)
            texts.add(txt)
        cards.arrange(RIGHT, buff=0.55).shift(UP * 0.4)
        for txt, box in zip(texts, cards):
            txt.move_to(box.get_center())

        arrows = VGroup(
            Arrow(cards[0].get_right(), cards[1].get_left(), buff=0.15, color=GREY_B),
            Arrow(cards[1].get_right(), cards[2].get_left(), buff=0.15, color=GREY_B),
        )

        answer_box = RoundedRectangle(corner_radius=0.2, width=7.4, height=1.55, stroke_color=PINK_3B1B, stroke_width=5)
        answer_box.set_fill(PINK_3B1B, opacity=0.12)
        answer_box.shift(DOWN * 1.6)
        answer_text = Text(
            "Two-sample z-interval\nfor a difference in proportions",
            font_size=28,
            color=PINK_3B1B,
            weight=BOLD,
            line_spacing=0.8,
        )
        answer_text.move_to(answer_box.get_center())

        connector = Arrow(cards[1].get_bottom(), answer_box.get_top(), buff=0.2, color=GREY_B)

        self.play(Write(title), FadeIn(prompt, shift=UP * 0.2))
        self.wait(0.4)

        for box, txt in zip(cards, texts):
            self.play(Create(box), Write(txt), run_time=0.6)
        self.play(LaggedStart(*[Create(arrow) for arrow in arrows], lag_ratio=0.2), run_time=0.5)
        self.wait(0.7)

        self.play(Create(connector), Create(answer_box), Write(answer_text), run_time=1.0)
        self.wait(0.8)

        highlight = SurroundingRectangle(answer_box, color=GREEN_3B1B, buff=0.08, stroke_width=5)
        takeaway = Text("Two groups + CI + proportions", font_size=24, color=GREEN_3B1B, weight=BOLD)
        takeaway.next_to(answer_box, DOWN, buff=0.35)

        self.play(Create(highlight), FadeIn(takeaway, shift=UP * 0.15), run_time=0.8)
        self.wait(2.5)
