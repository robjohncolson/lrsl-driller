"""
L02 — Factor to Zero
The level gives ONE factor at a time and asks "what zero does it produce?"
This animation shows three individual factors being set = 0 and solved,
including a leading-coefficient case (2x - 4) that requires dividing.

Run with:
manim -qm --format=mp4 a02_factor_to_zero.py FactorToZero
"""
from manim import *
from common import ACCENT, BG, INK, NEG, POS, SOFT, footer_note, setup_scene


class FactorToZero(Scene):
    def construct(self):
        setup_scene(self, "Factor → Zero")

        # Each row: factor on left, arrow, solution on right
        pairs = [
            (r"(x - 5)", r"x - 5 = 0", r"x = 5"),
            (r"(x + 3)", r"x + 3 = 0", r"x = -3"),
            (r"(2x - 4)", r"2x - 4 = 0", r"x = 2"),
        ]
        colors = [ACCENT, SOFT, POS]

        rows = VGroup()
        for i, (factor, equation, solution) in enumerate(pairs):
            factor_tex = MathTex(factor, font_size=38, color=INK)
            arrow = MathTex(r"\Rightarrow", font_size=34, color=colors[i])
            eq_tex = MathTex(equation, font_size=34, color=colors[i])
            arrow2 = MathTex(r"\Rightarrow", font_size=34, color=colors[i])
            sol_tex = MathTex(solution, font_size=38, color=colors[i])
            row = VGroup(factor_tex, arrow, eq_tex, arrow2, sol_tex).arrange(RIGHT, buff=0.25)
            rows.add(row)

        rows.arrange(DOWN, buff=0.55)
        rows.shift(UP * 0.1)

        # Animate each row one at a time
        for i, row in enumerate(rows):
            # Show factor
            self.play(Write(row[0]), run_time=0.5)
            # Show "set = 0" step
            self.play(FadeIn(row[1]), Write(row[2]), run_time=0.6)
            # Show solution
            self.play(FadeIn(row[3]), Write(row[4]), run_time=0.6)
            # Brief highlight on the solution
            self.play(Indicate(row[4], color=colors[i]), run_time=0.4)

        # Callout for the coefficient case
        brace = Brace(rows[2][2], DOWN, color=NEG)
        note = Text("Divide both sides by 2!", font_size=22, color=NEG).next_to(brace, DOWN, buff=0.15)
        self.play(GrowFromCenter(brace), FadeIn(note))

        self.add(footer_note("Set the factor = 0 and solve. Watch for coefficients!"))
        self.wait(2)
