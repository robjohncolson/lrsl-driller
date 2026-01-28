"""
Manim animation for checking independence using the conditional method.

To render:
manim -qm --format=mp4 l26_check_indep_conditional.py CheckIndepConditional
"""

from manim import *


class CheckIndepConditional(Scene):
    def construct(self):
        # Title
        title = Text("Checking Independence: Conditional Method", font_size=40, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)

        # Main formula for checking
        formula_text = Text("Compare:", font_size=36)
        formula = MathTex(r"P(A|B)", r"\text{ vs }", r"P(A)", font_size=48)
        formula_group = VGroup(formula_text, formula).arrange(DOWN, buff=0.3)
        formula_group.next_to(title, DOWN, buff=0.5)

        self.play(Write(formula_text))
        self.play(Write(formula))
        self.wait(1.5)

        # Fade out formula to make room for examples
        self.play(
            FadeOut(formula_text),
            FadeOut(formula),
        )

        # Example 1: Independent
        ex1_title = Text("Example 1: Independent", font_size=32, weight=BOLD, color=GREEN)
        ex1_title.move_to(UP * 1.5)

        self.play(Write(ex1_title))
        self.wait(0.5)

        # Show P(A) and P(A|B) side by side
        pa_box = VGroup(
            Text("P(A)", font_size=32),
            MathTex("0.4", font_size=44, color=BLUE)
        ).arrange(DOWN, buff=0.3)

        pab_box = VGroup(
            Text("P(A|B)", font_size=32),
            MathTex("0.4", font_size=44, color=BLUE)
        ).arrange(DOWN, buff=0.3)

        comparison1 = VGroup(pa_box, pab_box).arrange(RIGHT, buff=2)
        comparison1.move_to(UP * 0.3)

        self.play(FadeIn(pa_box), FadeIn(pab_box))
        self.wait(1)

        # Show equality
        equals_sign = MathTex("=", font_size=60, color=GREEN)
        equals_sign.move_to((pa_box.get_right() + pab_box.get_left()) / 2)
        self.play(Write(equals_sign))
        self.wait(0.5)

        # Show result
        result1 = Text("INDEPENDENT", font_size=36, weight=BOLD, color=GREEN)
        result1.next_to(comparison1, DOWN, buff=0.5)
        self.play(Write(result1))
        self.wait(1.5)

        # Fade out example 1
        self.play(
            FadeOut(ex1_title),
            FadeOut(comparison1),
            FadeOut(equals_sign),
            FadeOut(result1)
        )

        # Example 2: Dependent
        ex2_title = Text("Example 2: Dependent", font_size=32, weight=BOLD, color=RED)
        ex2_title.move_to(UP * 1.5)

        self.play(Write(ex2_title))
        self.wait(0.5)

        # Show P(A) and P(A|B) side by side
        pa_box2 = VGroup(
            Text("P(A)", font_size=32),
            MathTex("0.4", font_size=44, color=BLUE)
        ).arrange(DOWN, buff=0.3)

        pab_box2 = VGroup(
            Text("P(A|B)", font_size=32),
            MathTex("0.6", font_size=44, color=ORANGE)
        ).arrange(DOWN, buff=0.3)

        comparison2 = VGroup(pa_box2, pab_box2).arrange(RIGHT, buff=2)
        comparison2.move_to(UP * 0.3)

        self.play(FadeIn(pa_box2), FadeIn(pab_box2))
        self.wait(1)

        # Show inequality - use text instead of neq symbol
        not_equals_sign = Text("≠", font_size=60, color=RED)
        not_equals_sign.move_to((pa_box2.get_right() + pab_box2.get_left()) / 2)
        self.play(Write(not_equals_sign))
        self.wait(0.5)

        # Show result
        result2 = Text("DEPENDENT", font_size=36, weight=BOLD, color=RED)
        result2.next_to(comparison2, DOWN, buff=0.5)
        self.play(Write(result2))
        self.wait(1.5)

        # Fade out example 2
        self.play(
            FadeOut(ex2_title),
            FadeOut(comparison2),
            FadeOut(not_equals_sign),
            FadeOut(result2)
        )

        # Key insight
        insight = Text(
            "If knowing B changes P(A),\nthey're dependent",
            font_size=32,
            line_spacing=1.2,
            weight=BOLD,
            color=YELLOW
        )
        insight.move_to(ORIGIN)

        self.play(Write(insight))
        self.wait(2)

        # Fade out
        self.play(FadeOut(insight), FadeOut(title))
        self.wait(0.5)
