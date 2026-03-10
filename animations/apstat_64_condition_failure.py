"""
Visualize how one failed condition blocks a one-sample z-test for a proportion.

Run with: manim -qm --format=mp4 animations/apstat_64_condition_failure.py ConditionFailure64
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ConditionFailure64(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Diagnose the Failing Condition", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        labels = [
            ("Random or assigned?", GREEN_3B1B, "✓"),
            ("10% rule?", PINK_3B1B, "✗"),
            ("Large counts?", GREEN_3B1B, "✓"),
        ]

        cards = VGroup()
        marks = VGroup()
        for index, (label, color, mark) in enumerate(labels):
            card = RoundedRectangle(
                corner_radius=0.2,
                width=3.45,
                height=2.15,
                stroke_color=color,
                stroke_width=4,
            )
            card.set_fill(color, opacity=0.12)
            card.shift(LEFT * 4.0 + RIGHT * 4.0 * index + DOWN * 0.15)

            card_label = Text(label, font_size=28, color=WHITE, weight=BOLD)
            card_label.move_to(card.get_center() + UP * 0.35)
            card_mark = Text(mark, font_size=44, color=color, weight=BOLD)
            card_mark.move_to(card.get_center() + DOWN * 0.45)

            cards.add(VGroup(card, card_label))
            marks.add(card_mark)

        summary = RoundedRectangle(
            corner_radius=0.2,
            width=9.3,
            height=1.35,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        summary.set_fill(YELLOW_3B1B, opacity=0.12)
        summary.shift(DOWN * 2.65)
        summary_text = Text("One failed condition means stop the z-test.", font_size=30, color=YELLOW_3B1B, weight=BOLD)
        summary_text.move_to(summary.get_center())

        note = Text("Name the exact issue: random, 10%, or large counts.", font_size=26, color=TEAL_3B1B, weight=BOLD)
        note.next_to(summary, DOWN, buff=0.35)

        self.play(FadeIn(title))
        self.play(FadeIn(cards))
        self.play(Write(marks))
        self.play(FadeIn(summary), Write(summary_text))
        self.play(FadeIn(note))
        self.wait(2)
