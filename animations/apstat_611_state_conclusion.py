"""
Visualize the structure of a complete conclusion for a two-proportion z test.

Run with: manim -qm --format=mp4 animations/apstat_611_state_conclusion.py Conclusion611
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class Conclusion611(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Write the Conclusion", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        line1_box = RoundedRectangle(corner_radius=0.18, width=12.2, height=1.1, stroke_color=YELLOW_3B1B, stroke_width=4)
        line1_box.set_fill(YELLOW_3B1B, opacity=0.10)
        line1_box.shift(UP * 1.5)
        line1 = Text("Because the p-value is less than alpha, ...", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        line1.move_to(line1_box.get_center())

        line2_box = RoundedRectangle(corner_radius=0.18, width=8.2, height=1.05, stroke_color=TEAL_3B1B, stroke_width=4)
        line2_box.set_fill(TEAL_3B1B, opacity=0.10)
        line2_box.shift(UP * 0.1)
        line2 = Text("... we reject H₀ ...", font_size=30, color=TEAL_3B1B, weight=BOLD)
        line2.move_to(line2_box.get_center())

        line3_box = RoundedRectangle(corner_radius=0.18, width=12.8, height=1.55, stroke_color=PINK_3B1B, stroke_width=4)
        line3_box.set_fill(PINK_3B1B, opacity=0.10)
        line3_box.shift(DOWN * 1.65)
        line3 = VGroup(
            Text("... so there is convincing statistical evidence that", font_size=24, color=WHITE),
            Text("the difference in the population proportions is greater than 0.", font_size=26, color=PINK_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.10).move_to(line3_box.get_center())

        checklist = VGroup(
            Text("1. Compare p-value to alpha", font_size=24, color=BLUE_3B1B),
            Text("2. State reject or fail to reject", font_size=24, color=GREEN_3B1B),
            Text("3. Conclude about Hₐ in context", font_size=24, color=TEAL_3B1B),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
        checklist.to_edge(DOWN, buff=0.35)

        self.play(FadeIn(title, shift=DOWN))
        self.play(Create(line1_box), FadeIn(line1, shift=UP * 0.2))
        self.play(Create(line2_box), FadeIn(line2, shift=UP * 0.2))
        self.play(Create(line3_box), FadeIn(line3, shift=UP * 0.2))
        self.play(FadeIn(checklist, shift=UP * 0.2))
        self.wait(2)
