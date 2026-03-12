"""
Independent vs Mutually Exclusive Comparison (AP Stats Unit 4, Topic 4.6g)

Shows that independent and mutually exclusive are DIFFERENT concepts
and cannot both be true (for events with nonzero probability).

Run with: manim -qm --format=mp4 indep_vs_mut_excl_compare.py IndepVsMutExclCompare
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class IndepVsMutExclCompare(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Independent vs Mutually Exclusive", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== DEFINITIONS SIDE BY SIDE ==========
        left_title = Text("Independent", font_size=24, color=ManimColor(GREEN_3B1B), weight=BOLD)
        left_title.move_to(LEFT * 3.5 + UP * 2)
        left_def = MathTex(r"P(A \cap B) = P(A) \cdot P(B)", font_size=24, color=ManimColor(GREEN_3B1B))
        left_def.next_to(left_title, DOWN, buff=0.15)
        left_meaning = Text("Knowing A doesn't\nchange P(B)", font_size=16, color=GREY_B)
        left_meaning.next_to(left_def, DOWN, buff=0.15)

        right_title = Text("Mutually Exclusive", font_size=24, color=ManimColor(RED_3B1B), weight=BOLD)
        right_title.move_to(RIGHT * 3.5 + UP * 2)
        right_def = MathTex(r"P(A \cap B) = 0", font_size=24, color=ManimColor(RED_3B1B))
        right_def.next_to(right_title, DOWN, buff=0.15)
        right_meaning = Text("A and B cannot\nhappen together", font_size=16, color=GREY_B)
        right_meaning.next_to(right_def, DOWN, buff=0.15)

        divider = DashedLine(UP * 2.3, DOWN * 0.3, color=GREY_B, dash_length=0.1)

        self.play(
            Write(left_title), Write(left_def), Write(left_meaning),
            Write(right_title), Write(right_def), Write(right_meaning),
            Create(divider),
            run_time=0.8,
        )
        self.wait(0.8)

        # ========== KEY CONFLICT ==========
        conflict = VGroup(
            Text("Can events be BOTH?", font_size=22, color=YELLOW_3B1B, weight=BOLD),
            Text("If P(A) > 0 and P(B) > 0:", font_size=18, color=GREY_B),
            MathTex(r"\text{ME} \Rightarrow P(A \cap B) = 0", font_size=22, color=ManimColor(RED_3B1B)),
            MathTex(r"\text{Indep} \Rightarrow P(A \cap B) = P(A) \cdot P(B) > 0", font_size=22, color=ManimColor(GREEN_3B1B)),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        conflict.next_to(divider, DOWN, buff=0.5).align_to(LEFT * 5.5, LEFT)

        for item in conflict:
            self.play(Write(item), run_time=0.3)
        self.wait(0.5)

        # ========== CONCLUSION ==========
        conclusion = Text(
            "Mutually exclusive events (with P > 0) are NEVER independent.",
            font_size=20, color=YELLOW_3B1B,
        )
        conclusion.to_edge(DOWN, buff=0.4)
        conclusion_box = SurroundingRectangle(conclusion, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(conclusion), Create(conclusion_box), run_time=0.5)
        self.wait(1.5)
