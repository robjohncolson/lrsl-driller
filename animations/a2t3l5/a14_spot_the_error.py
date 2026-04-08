"""
L14 — Error Analysis Capstone
Shows a main cross/touch error, then adds quick checks for sign-chart and
complex-arithmetic mistakes so students learn a repeatable review method.

Run with:
manim -qm --format=mp4 a14_spot_the_error.py SpotTheError
"""
from manim import *
from common import ACCENT, BG, INK, NEG, POS, SOFT, footer_note, setup_scene, simple_axes


class SpotTheError(Scene):
    def construct(self):
        setup_scene(self, "Spot the Error")

        checklist = Text(
            "Go line by line: signs, exponent, cross/touch, sign chart, endpoints, i², shifts.",
            font_size=20,
            color=SOFT
        ).to_edge(UP).shift(DOWN * 0.7)
        self.play(FadeIn(checklist, shift=DOWN * 0.08))

        student_box = RoundedRectangle(width=10.8, height=1.15, corner_radius=0.14, color=NEG)
        student_box.set_fill(BG, opacity=1).shift(UP * 1.55)
        student_label = Text("Student says:", font_size=22, color=NEG).next_to(student_box, UP, buff=0.1, aligned_edge=LEFT)
        student_claim = MathTex(
            r"f(x)=(x-5)(x-1)^2",
            r"\text{ crosses at }x\!=\!1",
            r"\text{, touches at }x\!=\!5",
            font_size=30,
            color=INK
        ).move_to(student_box)

        self.play(Create(student_box), FadeIn(student_label))
        self.play(Write(student_claim))
        self.play(Create(SurroundingRectangle(student_claim[1], color=NEG, buff=0.08)))
        self.play(Create(SurroundingRectangle(student_claim[2], color=NEG, buff=0.08)))

        axes = simple_axes(x_range=[-1, 6, 1], y_range=[-4, 4, 1], length=5.3)
        axes.shift(DOWN * 1.0 + LEFT * 2.9)
        graph = axes.plot(lambda x: 0.15 * (x - 5) * (x - 1) ** 2, color=POS, x_range=[-0.5, 5.8])
        dot_1 = Dot(axes.c2p(1, 0), color=SOFT)
        dot_5 = Dot(axes.c2p(5, 0), color=ACCENT)
        label_1 = VGroup(
            MathTex(r"x=1", font_size=24, color=SOFT),
            Text("mult 2 → touch", font_size=20, color=SOFT)
        ).arrange(DOWN, buff=0.08).next_to(dot_1, DOWN, buff=0.22)
        label_5 = VGroup(
            MathTex(r"x=5", font_size=24, color=ACCENT),
            Text("mult 1 → cross", font_size=20, color=ACCENT)
        ).arrange(DOWN, buff=0.08).next_to(dot_5, UP, buff=0.22)

        self.play(Create(axes), Create(graph))
        self.play(FadeIn(dot_1), FadeIn(dot_5), FadeIn(label_1), FadeIn(label_5))

        card1 = RoundedRectangle(width=4.35, height=1.65, corner_radius=0.12, color=NEG).set_fill(BG, opacity=1)
        card2 = RoundedRectangle(width=4.35, height=1.65, corner_radius=0.12, color=NEG).set_fill(BG, opacity=1)
        card1.move_to(RIGHT * 3.0 + DOWN * 0.45)
        card2.move_to(RIGHT * 3.0 + DOWN * 2.45)
        card1_text = VGroup(
            Text("Sign chart error", font_size=20, color=NEG, weight=BOLD),
            MathTex(r"(-)(-)(+)=-", font_size=28, color=INK),
            MathTex(r"\text{Correct: }(-)(-)(+)=+", font_size=24, color=POS),
        ).arrange(DOWN, buff=0.06).move_to(card1)
        card2_text = VGroup(
            Text("Complex arithmetic error", font_size=20, color=NEG, weight=BOLD),
            MathTex(r"25i^2=25", font_size=28, color=INK),
            MathTex(r"\text{Correct: }25i^2=-25", font_size=24, color=POS),
        ).arrange(DOWN, buff=0.06).move_to(card2)

        self.play(Create(card1), FadeIn(card1_text))
        self.play(Create(card2), FadeIn(card2_text))

        self.add(footer_note("State the exact mistake, name the rule, then write the corrected work."))
        self.wait(2.5)
