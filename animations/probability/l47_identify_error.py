"""
Identify the Error Animation

Shows common student mistakes with combining random variables
and how to correct them.

To render:
manim -qm --format=mp4 l47_identify_error.py IdentifyError
"""

from manim import *

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

class IdentifyError(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # Title
        title = Text("Spot the Error", font_size=48, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.3)

        # Student work box
        work_label = Text("Student's Work:", font_size=32, color=YELLOW_3B1B)
        work_label.shift(UP * 2 + LEFT * 3)
        self.play(Write(work_label))

        # The problem
        problem = MathTex(
            r"\text{Given: } \sigma_X = 3, \quad \sigma_Y = 4",
            font_size=32
        )
        problem.next_to(work_label, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(Write(problem))

        # Student's wrong answer
        student_work = MathTex(
            r"\sigma_{X+Y} = 3 + 4 = 7",
            font_size=40
        )
        student_work.next_to(problem, DOWN, buff=0.5)
        student_work_box = SurroundingRectangle(
            student_work, color=WHITE, buff=0.2, corner_radius=0.1
        )

        self.play(Write(student_work), Create(student_work_box))
        self.wait(0.5)

        # Red pen circle around error
        error_circle = Ellipse(
            width=2.2, height=0.8,
            color=RED, stroke_width=4
        )
        error_circle.move_to(student_work[0][6:11])  # Around "3 + 4"
        error_circle.shift(LEFT * 0.2)

        self.play(Create(error_circle))
        self.wait(0.3)

        # Question
        question = Text("What went wrong?", font_size=36, color=RED)
        question.next_to(student_work_box, DOWN, buff=0.5)
        self.play(Write(question))
        self.wait(0.5)

        # Arrow pointing to error
        arrow = Arrow(
            RIGHT * 2 + UP * 0.3,
            error_circle.get_right() + RIGHT * 0.2,
            color=RED,
            buff=0.1
        )
        error_label = Text("Added SDs directly!", font_size=28, color=RED)
        error_label.next_to(arrow, RIGHT, buff=0.1)

        self.play(GrowArrow(arrow), Write(error_label))
        self.wait(0.5)

        # Correction
        correction_label = Text("Correction:", font_size=32, color=GREEN, weight=BOLD)
        correction_label.shift(DOWN * 1.5 + LEFT * 3)
        self.play(Write(correction_label))

        # Cross out wrong answer
        cross_line = Line(
            student_work.get_left() + LEFT * 0.1,
            student_work.get_right() + RIGHT * 0.1,
            color=RED, stroke_width=4
        )
        self.play(Create(cross_line))

        # Correct work
        correct_step1 = MathTex(
            r"\sqrt{3^2 + 4^2}",
            font_size=36
        )
        correct_step1.next_to(correction_label, DOWN, buff=0.3, aligned_edge=LEFT)

        correct_step2 = MathTex(
            r"= \sqrt{9 + 16}",
            font_size=36
        )
        correct_step2.next_to(correct_step1, RIGHT, buff=0.2)

        correct_step3 = MathTex(
            r"= \sqrt{25} = 5",
            font_size=36,
            color=GREEN
        )
        correct_step3.next_to(correct_step2, RIGHT, buff=0.2)

        self.play(Write(correct_step1))
        self.wait(0.2)
        self.play(Write(correct_step2))
        self.wait(0.2)
        self.play(Write(correct_step3))
        self.wait(0.5)

        # Takeaway
        takeaway = VGroup(
            Text("Always add", font_size=32, color=WHITE),
            Text("VARIANCES", font_size=36, color=YELLOW_3B1B, weight=BOLD),
            Text(", then square root", font_size=32, color=WHITE)
        ).arrange(RIGHT, buff=0.2)
        takeaway.to_edge(DOWN, buff=0.6)

        takeaway_box = SurroundingRectangle(
            takeaway, color=GREEN, buff=0.2, corner_radius=0.1
        )

        self.play(Write(takeaway), Create(takeaway_box))
        self.wait(1.5)
