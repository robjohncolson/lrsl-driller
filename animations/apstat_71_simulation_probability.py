"""
Show how the simulation tail count becomes an estimated probability.

Run with: manim -qm --format=mp4 animations/apstat_71_simulation_probability.py MeanDiffSimulationProbability
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffSimulationProbability(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Estimate the Tail Probability", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        tail_box = RoundedRectangle(corner_radius=0.2, width=8.3, height=1.8, stroke_color=YELLOW_3B1B, stroke_width=4)
        tail_box.set_fill(YELLOW_3B1B, opacity=0.12)
        tail_box.shift(UP * 0.85)
        tail_text = Text("13 of 1000 simulated differences were ≥ 12.49", font_size=30, weight=BOLD)
        tail_text.move_to(tail_box.get_center())

        arrow = Arrow(UP * 0.0, DOWN * 0.9, color=TEAL_3B1B, stroke_width=6)
        arrow.shift(DOWN * 0.2)

        prob_box = RoundedRectangle(corner_radius=0.2, width=7.8, height=1.8, stroke_color=GREEN_3B1B, stroke_width=4)
        prob_box.set_fill(GREEN_3B1B, opacity=0.12)
        prob_box.shift(DOWN * 1.6)
        prob_line_1 = Text("Estimated probability", font_size=28)
        prob_line_2 = Text("P(diff ≥ 12.49) ≈ 13 / 1000 = 0.013", font_size=30, color=GREEN_3B1B, weight=BOLD)
        prob_text = VGroup(prob_line_1, prob_line_2).arrange(DOWN, buff=0.18).move_to(prob_box.get_center())

        footer = Text("Small tail count  ->  small probability", font_size=28, color=BLUE_3B1B)
        footer.shift(DOWN * 2.95)

        self.play(Write(title), run_time=0.8)
        self.play(Create(tail_box), Write(tail_text), run_time=0.9)
        self.play(GrowArrow(arrow), run_time=0.5)
        self.play(Create(prob_box), Write(prob_text), run_time=0.9)
        self.play(Write(footer), run_time=0.7)
        self.wait(1.8)
