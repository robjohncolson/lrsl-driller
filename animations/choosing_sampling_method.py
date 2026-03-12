"""
Choosing a Sampling Method (AP Stats Unit 3, Topic 3.4b)

Decision framework for selecting the right sampling method.

Run with: manim -qm --format=mp4 choosing_sampling_method.py ChoosingSamplingMethod
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class ChoosingSamplingMethod(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Choosing a Sampling Method", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== DECISION FLOWCHART ==========
        q1 = Text("Do important subgroups exist?", font_size=20, color=ManimColor(TEAL_3B1B), weight=BOLD)
        q1.next_to(title, DOWN, buff=0.4)
        self.play(Write(q1), run_time=0.3)

        # YES branch
        yes1 = Text("Yes", font_size=16, color=ManimColor(GREEN_3B1B))
        yes1.next_to(q1, DOWN, buff=0.15).shift(LEFT * 3)
        arrow_y1 = Arrow(q1.get_bottom(), yes1.get_top(), buff=0.05, color=ManimColor(GREEN_3B1B), max_tip_length_to_length_ratio=0.15)

        strat_answer = Text("\u2192 Stratified sampling", font_size=18, color=ManimColor(BLUE_3B1B), weight=BOLD)
        strat_answer.next_to(yes1, DOWN, buff=0.1)
        strat_note = Text("Ensures representation from each group", font_size=14, color=GREY_B)
        strat_note.next_to(strat_answer, DOWN, buff=0.04)

        self.play(Create(arrow_y1), Write(yes1), run_time=0.3)
        self.play(Write(strat_answer), Write(strat_note), run_time=0.3)

        # NO branch
        no1 = Text("No", font_size=16, color=ManimColor(RED_3B1B))
        no1.next_to(q1, DOWN, buff=0.15).shift(RIGHT * 3)
        arrow_n1 = Arrow(q1.get_bottom(), no1.get_top(), buff=0.05, color=ManimColor(RED_3B1B), max_tip_length_to_length_ratio=0.15)
        self.play(Create(arrow_n1), Write(no1), run_time=0.3)

        q2 = Text("Are subjects in natural groups\n(classrooms, neighborhoods)?", font_size=17, color=ManimColor(TEAL_3B1B))
        q2.next_to(no1, DOWN, buff=0.15)
        self.play(Write(q2), run_time=0.3)

        # YES → Cluster
        yes2 = Text("Yes", font_size=16, color=ManimColor(GREEN_3B1B))
        yes2.next_to(q2, DOWN, buff=0.15).shift(LEFT * 1.5)
        cluster_answer = Text("\u2192 Cluster sampling", font_size=18, color=ManimColor(ORANGE_3B1B), weight=BOLD)
        cluster_answer.next_to(yes2, DOWN, buff=0.1)
        cluster_note = Text("Cheaper, survey whole groups", font_size=14, color=GREY_B)
        cluster_note.next_to(cluster_answer, DOWN, buff=0.04)

        arrow_y2 = Arrow(q2.get_bottom(), yes2.get_top(), buff=0.05, color=ManimColor(GREEN_3B1B), max_tip_length_to_length_ratio=0.15)
        self.play(Create(arrow_y2), Write(yes2), run_time=0.3)
        self.play(Write(cluster_answer), Write(cluster_note), run_time=0.3)

        # NO → SRS
        no2 = Text("No", font_size=16, color=ManimColor(RED_3B1B))
        no2.next_to(q2, DOWN, buff=0.15).shift(RIGHT * 1.5)
        srs_answer = Text("\u2192 SRS", font_size=18, color=ManimColor(GREEN_3B1B), weight=BOLD)
        srs_answer.next_to(no2, DOWN, buff=0.1)
        srs_note = Text("Default gold standard", font_size=14, color=GREY_B)
        srs_note.next_to(srs_answer, DOWN, buff=0.04)

        arrow_n2 = Arrow(q2.get_bottom(), no2.get_top(), buff=0.05, color=ManimColor(RED_3B1B), max_tip_length_to_length_ratio=0.15)
        self.play(Create(arrow_n2), Write(no2), run_time=0.3)
        self.play(Write(srs_answer), Write(srs_note), run_time=0.3)
        self.wait(0.5)

        closing = Text(
            "The best method depends on the population structure and budget.",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.3)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
