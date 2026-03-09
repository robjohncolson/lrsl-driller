"""
Show how a small simulation probability leads to a conclusion.

Run with: manim -qm --format=mp4 animations/apstat_71_draw_conclusion.py MeanDiffDrawConclusion
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffDrawConclusion(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("From Probability to Conclusion", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        step_1 = RoundedRectangle(corner_radius=0.2, width=4.4, height=1.5, stroke_color=YELLOW_3B1B, stroke_width=4)
        step_1.set_fill(YELLOW_3B1B, opacity=0.12)
        step_1.shift(LEFT * 4.0 + UP * 0.6)
        step_1_text = Text("Small probability", font_size=30, color=YELLOW_3B1B, weight=BOLD).move_to(step_1.get_center())

        step_2 = RoundedRectangle(corner_radius=0.2, width=4.5, height=1.5, stroke_color=TEAL_3B1B, stroke_width=4)
        step_2.set_fill(TEAL_3B1B, opacity=0.12)
        step_2.shift(UP * 0.6)
        step_2_text = Text("Chance is unlikely", font_size=30, color=TEAL_3B1B, weight=BOLD).move_to(step_2.get_center())

        step_3 = RoundedRectangle(corner_radius=0.2, width=4.6, height=1.5, stroke_color=GREEN_3B1B, stroke_width=4)
        step_3.set_fill(GREEN_3B1B, opacity=0.12)
        step_3.shift(RIGHT * 4.0 + UP * 0.6)
        step_3_text = Text("Convincing evidence", font_size=30, color=GREEN_3B1B, weight=BOLD).move_to(step_3.get_center())

        arrow_1 = Arrow(step_1.get_right() + RIGHT * 0.08, step_2.get_left() + LEFT * 0.08, buff=0.1, color=BLUE_3B1B, stroke_width=6)
        arrow_2 = Arrow(step_2.get_right() + RIGHT * 0.08, step_3.get_left() + LEFT * 0.08, buff=0.1, color=BLUE_3B1B, stroke_width=6)

        note_box = RoundedRectangle(corner_radius=0.2, width=8.2, height=1.7, stroke_color=PINK_3B1B, stroke_width=4)
        note_box.set_fill(PINK_3B1B, opacity=0.12)
        note_box.shift(DOWN * 1.8)
        note_line_1 = Text("Use the simulation to rule out chance as the best explanation.", font_size=27)
        note_line_2 = Text("That gives evidence, not proof.", font_size=30, color=PINK_3B1B, weight=BOLD)
        note_group = VGroup(note_line_1, note_line_2).arrange(DOWN, buff=0.18).move_to(note_box.get_center())

        self.play(Write(title), run_time=0.8)
        self.play(Create(step_1), Write(step_1_text), run_time=0.8)
        self.play(GrowArrow(arrow_1), Create(step_2), Write(step_2_text), run_time=0.9)
        self.play(GrowArrow(arrow_2), Create(step_3), Write(step_3_text), run_time=0.9)
        self.play(Create(note_box), Write(note_group), run_time=0.9)
        self.wait(1.8)
