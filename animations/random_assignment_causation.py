"""
Random Assignment Enables Causal Conclusions (AP Stats Unit 3, Topic 3.2d)

Shows why random assignment to treatment groups allows us to establish cause-and-effect.

Run with: manim -qm --format=mp4 random_assignment_causation.py RandomAssignmentCausation
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class RandomAssignmentCausation(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Random Assignment \u2192 Causation", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== WHY IT WORKS ==========
        reason = Text(
            "Random assignment balances confounding variables across groups.",
            font_size=20, color=ManimColor(TEAL_3B1B),
        )
        reason.next_to(title, DOWN, buff=0.3)
        self.play(Write(reason), run_time=0.4)
        self.wait(0.3)

        # ========== EXPERIMENT DIAGRAM ==========
        subjects = Text("30 Subjects", font_size=22, color=GREY_B, weight=BOLD)
        subjects.next_to(reason, DOWN, buff=0.4)
        self.play(Write(subjects), run_time=0.3)

        arrow_l = Arrow(subjects.get_bottom(), subjects.get_bottom() + DOWN * 0.6 + LEFT * 2.5,
                        color=ManimColor(BLUE_3B1B), buff=0.1)
        arrow_r = Arrow(subjects.get_bottom(), subjects.get_bottom() + DOWN * 0.6 + RIGHT * 2.5,
                        color=ManimColor(ORANGE_3B1B), buff=0.1)
        rand_label = Text("Random\nAssignment", font_size=14, color=YELLOW_3B1B)
        rand_label.next_to(subjects, DOWN, buff=0.05)

        treatment = Text("Treatment\nGroup (15)", font_size=18, color=ManimColor(BLUE_3B1B), weight=BOLD)
        treatment.next_to(arrow_l.get_end(), DOWN, buff=0.1)
        control = Text("Control\nGroup (15)", font_size=18, color=ManimColor(ORANGE_3B1B), weight=BOLD)
        control.next_to(arrow_r.get_end(), DOWN, buff=0.1)

        self.play(
            Create(arrow_l), Create(arrow_r), Write(rand_label),
            Write(treatment), Write(control),
            run_time=0.6,
        )
        self.wait(0.5)

        # ========== CONFOUNDERS BALANCED ==========
        balance_title = Text("Confounders are balanced:", font_size=18, color=ManimColor(TEAL_3B1B))
        balance_title.next_to(VGroup(treatment, control), DOWN, buff=0.35)

        confounders = VGroup(
            Text("Age, gender, health, diet, exercise, genetics...", font_size=16, color=GREY_B),
            Text("all roughly equal in BOTH groups", font_size=16, color=ManimColor(GREEN_3B1B)),
        ).arrange(DOWN, buff=0.06).next_to(balance_title, DOWN, buff=0.1)
        self.play(Write(balance_title), run_time=0.3)
        self.play(Write(confounders[0]), Write(confounders[1]), run_time=0.4)
        self.wait(0.5)

        # ========== THEREFORE ==========
        therefore = Text(
            "Any difference in outcomes is caused by the treatment.",
            font_size=20, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        therefore.next_to(confounders, DOWN, buff=0.3)
        self.play(Write(therefore), run_time=0.4)

        closing = Text(
            "No random assignment \u2192 only association, not causation.",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
