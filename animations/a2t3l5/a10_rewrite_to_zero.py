"""
Run with:
manim -qm --format=mp4 a10_rewrite_to_zero.py RewriteToZero
"""
from manim import *
from common import ACCENT, INK, POS, SOFT, setup_scene


class RewriteToZero(Scene):
    def construct(self):
        setup_scene(self, "Rewrite the Equation to Zero")

        original = MathTex(r"x^3+5x^2-x-7=x^2+6x+3", font_size=34, color=INK).shift(UP * 2.25)
        subtract_note = Text("Subtract x², 6x, and 3 from both sides.", font_size=22, color=ACCENT).shift(UP * 1.45)
        subtract = MathTex(
            r"x^3+5x^2-x-7",
            r"-x^2",
            r"-6x",
            r"-3",
            r"=0",
            font_size=30,
            color=INK
        ).shift(UP * 0.75)
        subtract[1].set_color(ACCENT)
        subtract[2].set_color(ACCENT)
        subtract[3].set_color(ACCENT)

        grouped = MathTex(
            r"x^3",
            r"+",
            r"(5x^2-x^2)",
            r"+",
            r"(-x-6x)",
            r"+",
            r"(-7-3)",
            r"=0",
            font_size=30,
            color=INK
        ).shift(DOWN * 0.05)
        grouped[2].set_color(ACCENT)
        grouped[4].set_color(SOFT)
        grouped[6].set_color(POS)

        simplified = MathTex(r"x^3+4x^2-7x-10=0", font_size=34, color=ACCENT).shift(DOWN * 0.92)
        test_root = MathTex(r"f(-1)=(-1)^3+4(-1)^2-7(-1)-10=0", font_size=28, color=POS).shift(DOWN * 1.75)
        factor_one = MathTex(r"x^3+4x^2-7x-10=(x+1)(x^2+3x-10)", font_size=28, color=POS).shift(DOWN * 2.45)
        pair_note = Text("Now factor x² + 3x - 10: use 5 and -2.", font_size=22, color=ACCENT).shift(DOWN * 3.05)
        final_factor = MathTex(r"(x+1)(x+5)(x-2)=0", font_size=32, color=ACCENT).shift(DOWN * 3.6)
        solutions = MathTex(r"x=-1,\;x=-5,\;x=2", font_size=32, color=INK).shift(DOWN * 4.2)

        self.play(Write(original))
        self.play(FadeIn(subtract_note, shift=UP * 0.1))
        self.play(Write(subtract))
        self.play(Write(grouped))
        self.play(Write(simplified))
        self.play(Write(test_root))
        self.play(Write(factor_one))
        self.play(FadeIn(pair_note, shift=UP * 0.1))
        self.play(Write(final_factor))
        self.play(Write(solutions))
        self.wait(2)
