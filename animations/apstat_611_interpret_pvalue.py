"""
Visualize the three-part structure of a p-value interpretation for a two-proportion test.

Run with: manim -qm --format=mp4 animations/apstat_611_interpret_pvalue.py InterpretPValue611
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class InterpretPValue611(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Interpret the p-Value", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        box1 = RoundedRectangle(corner_radius=0.18, width=10.8, height=1.15, stroke_color=BLUE_3B1B, stroke_width=4)
        box1.set_fill(BLUE_3B1B, opacity=0.10)
        box1.shift(UP * 1.5)
        text1 = Text("1. Assume H₀ is true: the population difference is 0.", font_size=28, color=BLUE_3B1B, weight=BOLD)
        text1.move_to(box1.get_center())

        box2 = RoundedRectangle(corner_radius=0.18, width=10.8, height=1.15, stroke_color=GREEN_3B1B, stroke_width=4)
        box2.set_fill(GREEN_3B1B, opacity=0.10)
        box2.shift(UP * 0.1)
        text2 = Text("2. State the probability: p-value = 0.1556.", font_size=28, color=GREEN_3B1B, weight=BOLD)
        text2.move_to(box2.get_center())

        box3 = RoundedRectangle(corner_radius=0.18, width=11.8, height=1.55, stroke_color=PINK_3B1B, stroke_width=4)
        box3.set_fill(PINK_3B1B, opacity=0.10)
        box3.shift(DOWN * 1.55)
        text3 = VGroup(
            Text("3. Describe the sample result:", font_size=24, color=WHITE),
            Text("a difference of -0.037 or more different", font_size=28, color=PINK_3B1B, weight=BOLD),
            Text("in either direction by chance alone.", font_size=24, color=WHITE),
        ).arrange(DOWN, buff=0.08).move_to(box3.get_center())

        arrows = VGroup(
            Arrow(box1.get_bottom(), box2.get_top(), color=YELLOW_3B1B, stroke_width=6, buff=0.12),
            Arrow(box2.get_bottom(), box3.get_top(), color=YELLOW_3B1B, stroke_width=6, buff=0.12),
        )

        footer = Text(
            "Assume -> probability -> sample result in context",
            font_size=26,
            color=TEAL_3B1B,
            weight=BOLD,
        )
        footer.to_edge(DOWN, buff=0.45)

        self.play(FadeIn(title, shift=DOWN))
        self.play(Create(box1), FadeIn(text1, shift=UP * 0.2))
        self.play(GrowArrow(arrows[0]), Create(box2), FadeIn(text2, shift=UP * 0.2))
        self.play(GrowArrow(arrows[1]), Create(box3), FadeIn(text3, shift=UP * 0.2))
        self.play(FadeIn(footer, shift=UP * 0.2))
        self.wait(2)
