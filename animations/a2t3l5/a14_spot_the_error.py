"""
L14 — Error Analysis Capstone
The capstone level tests 8+ error types spanning the entire lesson.
This animation shows the most fundamental error: reversing cross vs touch
behavior at zeros (scenario #1 from the bank), which ties together
the core concepts of multiplicity and graph behavior from the whole lesson.

Run with:
manim -qm --format=mp4 a14_spot_the_error.py SpotTheError
"""
from manim import *
from common import ACCENT, BG, INK, NEG, POS, SOFT, footer_note, setup_scene, simple_axes


class SpotTheError(Scene):
    def construct(self):
        setup_scene(self, "Spot the Error")

        # ── Student claim ──
        student_box = RoundedRectangle(width=11, height=1.2, corner_radius=0.14, color=NEG)
        student_box.set_fill(BG, opacity=1).shift(UP * 1.6)
        student_label = Text("Student says:", font_size=22, color=NEG)
        student_label.next_to(student_box, UP, buff=0.1, aligned_edge=LEFT)
        student_claim = MathTex(
            r"f(x)=(x-5)(x-1)^2",
            r"\text{ crosses at }x\!=\!1",
            r"\text{, touches at }x\!=\!5",
            font_size=30, color=INK
        ).move_to(student_box)

        self.play(Create(student_box), FadeIn(student_label))
        self.play(Write(student_claim))
        self.wait(0.5)

        # ── Highlight the error ──
        cross_wrong = SurroundingRectangle(student_claim[1], color=NEG, buff=0.08)
        touch_wrong = SurroundingRectangle(student_claim[2], color=NEG, buff=0.08)
        x_mark = Cross(student_claim, stroke_color=NEG, stroke_width=5)
        self.play(Create(cross_wrong), Create(touch_wrong))
        self.play(Create(x_mark), run_time=0.5)

        # ── Corrected analysis with graph ──
        axes = simple_axes(x_range=[-1, 6, 1], y_range=[-4, 4, 1], length=7)
        axes.shift(DOWN * 1.3)
        graph = axes.plot(
            lambda x: 0.15 * (x - 5) * (x - 1) ** 2,
            color=POS, x_range=[-0.5, 5.8]
        )
        dot_1 = Dot(axes.c2p(1, 0), color=SOFT)
        dot_5 = Dot(axes.c2p(5, 0), color=ACCENT)

        label_1 = VGroup(
            MathTex(r"x=1", font_size=24, color=SOFT),
            Text("mult 2 → touch", font_size=20, color=SOFT)
        ).arrange(DOWN, buff=0.08).next_to(dot_1, DOWN, buff=0.25)

        label_5 = VGroup(
            MathTex(r"x=5", font_size=24, color=ACCENT),
            Text("mult 1 → cross", font_size=20, color=ACCENT)
        ).arrange(DOWN, buff=0.08).next_to(dot_5, UP, buff=0.25)

        self.play(Create(axes), Create(graph))
        self.play(FadeIn(dot_1), FadeIn(dot_5))
        self.play(FadeIn(label_1), FadeIn(label_5))

        # ── Rule reminder ──
        self.add(footer_note("Odd multiplicity crosses. Even multiplicity touches. The student reversed them."))
        self.wait(2.5)
