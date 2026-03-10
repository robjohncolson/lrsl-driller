"""
Visualize the decision rule for a two-proportion significance test.

Run with: manim -qm --format=mp4 animations/apstat_611_make_decision.py Decision611
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class Decision611(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Make the Decision", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        p_box = RoundedRectangle(corner_radius=0.18, width=4.8, height=1.3, stroke_color=YELLOW_3B1B, stroke_width=4)
        p_box.set_fill(YELLOW_3B1B, opacity=0.10)
        p_box.shift(LEFT * 3.4 + UP * 0.8)
        p_text = VGroup(
            Text("p-value", font_size=24),
            Text("0.0122", font_size=34, color=YELLOW_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.12).move_to(p_box.get_center())

        a_box = RoundedRectangle(corner_radius=0.18, width=4.8, height=1.3, stroke_color=BLUE_3B1B, stroke_width=4)
        a_box.set_fill(BLUE_3B1B, opacity=0.10)
        a_box.shift(RIGHT * 3.4 + UP * 0.8)
        a_text = VGroup(
            Text("alpha", font_size=24),
            Text("0.05", font_size=34, color=BLUE_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.12).move_to(a_box.get_center())

        compare = Text("0.0122 < 0.05", font_size=34, color=GREEN_3B1B, weight=BOLD)
        compare.shift(DOWN * 0.45)

        decision_box = RoundedRectangle(corner_radius=0.18, width=5.2, height=1.15, stroke_color=TEAL_3B1B, stroke_width=4)
        decision_box.set_fill(TEAL_3B1B, opacity=0.10)
        decision_box.shift(LEFT * 3.1 + DOWN * 2.0)
        decision_text = Text("Reject H₀", font_size=30, color=TEAL_3B1B, weight=BOLD)
        decision_text.move_to(decision_box.get_center())

        evidence_box = RoundedRectangle(corner_radius=0.18, width=6.6, height=1.15, stroke_color=PINK_3B1B, stroke_width=4)
        evidence_box.set_fill(PINK_3B1B, opacity=0.10)
        evidence_box.shift(RIGHT * 2.8 + DOWN * 2.0)
        evidence_text = Text("Convincing evidence for Hₐ", font_size=26, color=PINK_3B1B, weight=BOLD)
        evidence_text.move_to(evidence_box.get_center())

        arrows = VGroup(
            Arrow(compare.get_bottom(), decision_box.get_top(), color=GREEN_3B1B, stroke_width=6, buff=0.12),
            Arrow(compare.get_bottom(), evidence_box.get_top(), color=GREEN_3B1B, stroke_width=6, buff=0.12),
        )

        self.play(FadeIn(title, shift=DOWN))
        self.play(Create(p_box), FadeIn(p_text, shift=UP * 0.2))
        self.play(Create(a_box), FadeIn(a_text, shift=UP * 0.2))
        self.play(Write(compare))
        self.play(GrowArrow(arrows[0]), Create(decision_box), FadeIn(decision_text, shift=UP * 0.2))
        self.play(GrowArrow(arrows[1]), Create(evidence_box), FadeIn(evidence_text, shift=UP * 0.2))
        self.wait(2)
