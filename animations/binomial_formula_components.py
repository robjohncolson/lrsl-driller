"""
Binomial Probability Formula Visualization

Renders the binomial probability formula with color-coded components,
then demonstrates with a concrete example (n=5, p=0.3, k=2).

Render command:
    manim -qm --format=mp4 binomial_formula_components.py BinomialFormulaComponents

Output: media/videos/binomial_formula_components/720p30/BinomialFormulaComponents.mp4
"""

from manim import *


class BinomialFormulaComponents(Scene):
    def construct(self):
        # Color definitions
        CHOOSE_COLOR = BLUE
        SUCCESS_COLOR = GREEN
        FAILURE_COLOR = RED

        # ============ TITLE ============
        title = Text("Binomial Probability Formula", font_size=42)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title))
        self.wait(0.5)

        # ============ COMPLETE FORMULA ============
        formula = MathTex(
            "P(X = k)", "=",
            "C(n,k)", r"\times",
            "p^k", r"\times",
            "(1-p)^{n-k}"
        )
        formula.scale(1.2)
        formula.next_to(title, DOWN, buff=0.8)

        self.play(Write(formula))
        self.wait(1)

        # ============ COLOR CODE COMPONENTS ============
        # Color the components
        formula[2].set_color(CHOOSE_COLOR)  # C(n,k)
        formula[4].set_color(SUCCESS_COLOR)  # p^k
        formula[6].set_color(FAILURE_COLOR)  # (1-p)^{n-k}

        self.play(
            formula[2].animate.set_color(CHOOSE_COLOR),
            formula[4].animate.set_color(SUCCESS_COLOR),
            formula[6].animate.set_color(FAILURE_COLOR),
            run_time=0.8
        )
        self.wait(0.5)

        # ============ COMPONENT EXPLANATIONS ============
        explanations = VGroup()

        # C(n,k) explanation
        choose_label = MathTex("C(n,k)", color=CHOOSE_COLOR)
        choose_text = Text(": Choose k successes from n trials", font_size=28)
        choose_row = VGroup(choose_label, choose_text).arrange(RIGHT, buff=0.2)

        # p^k explanation
        success_label = MathTex("p^k", color=SUCCESS_COLOR)
        success_text = Text(": Probability of k successes", font_size=28)
        success_row = VGroup(success_label, success_text).arrange(RIGHT, buff=0.2)

        # (1-p)^{n-k} explanation
        failure_label = MathTex("(1-p)^{n-k}", color=FAILURE_COLOR)
        failure_text = Text(": Probability of (n-k) failures", font_size=28)
        failure_row = VGroup(failure_label, failure_text).arrange(RIGHT, buff=0.2)

        explanations = VGroup(choose_row, success_row, failure_row)
        explanations.arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        explanations.next_to(formula, DOWN, buff=0.7)

        for exp in explanations:
            self.play(FadeIn(exp), run_time=0.6)
            self.wait(0.4)

        self.wait(1)

        # ============ TRANSITION TO EXAMPLE ============
        self.play(
            FadeOut(explanations),
            formula.animate.scale(0.8).to_edge(UP, buff=0.4),
            FadeOut(title),
            run_time=0.8
        )

        # ============ CONCRETE EXAMPLE ============
        example_title = Text("Example: n=5 trials, p=0.3, find P(X=2)", font_size=32)
        example_title.next_to(formula, DOWN, buff=0.5)
        self.play(Write(example_title))
        self.wait(0.5)

        # Substituted formula
        sub_formula = MathTex(
            "P(X = 2)", "=",
            "C(5,2)", r"\times",
            "0.3^2", r"\times",
            "0.7^3"
        )
        sub_formula[2].set_color(CHOOSE_COLOR)
        sub_formula[4].set_color(SUCCESS_COLOR)
        sub_formula[6].set_color(FAILURE_COLOR)
        sub_formula.next_to(example_title, DOWN, buff=0.5)

        self.play(Write(sub_formula))
        self.wait(0.8)

        # ============ CALCULATE EACH COMPONENT ============
        # Position for calculations
        calc_start = sub_formula.get_bottom() + DOWN * 0.6

        # C(5,2) calculation
        choose_calc = MathTex(
            "C(5,2)", "=", r"\frac{5!}{2!(5-2)!}", "=", r"\frac{5 \times 4}{2 \times 1}", "=", "10"
        )
        choose_calc.set_color(CHOOSE_COLOR)
        choose_calc.scale(0.85)
        choose_calc.move_to(calc_start)

        self.play(Write(choose_calc[:3]), run_time=0.6)
        self.wait(0.3)
        self.play(Write(choose_calc[3:5]), run_time=0.5)
        self.wait(0.3)
        self.play(Write(choose_calc[5:]), run_time=0.4)
        self.wait(0.5)

        # Move choose result and show next calculation
        choose_result = MathTex("10", color=CHOOSE_COLOR).scale(0.85)
        choose_result.move_to(choose_calc)

        self.play(
            ReplacementTransform(choose_calc, choose_result),
            choose_result.animate.shift(LEFT * 3 + DOWN * 0.3),
            run_time=0.6
        )

        # p^2 calculation
        success_calc = MathTex("0.3^2", "=", "0.09")
        success_calc.set_color(SUCCESS_COLOR)
        success_calc.scale(0.85)
        success_calc.next_to(choose_result, RIGHT, buff=0.5)

        self.play(Write(success_calc), run_time=0.5)
        self.wait(0.4)

        # (1-p)^3 calculation
        failure_calc = MathTex("0.7^3", "=", "0.343")
        failure_calc.set_color(FAILURE_COLOR)
        failure_calc.scale(0.85)
        failure_calc.next_to(success_calc, RIGHT, buff=0.5)

        self.play(Write(failure_calc), run_time=0.5)
        self.wait(0.5)

        # ============ FINAL MULTIPLICATION ============
        mult_line = MathTex(
            "P(X=2)", "=", "10", r"\times", "0.09", r"\times", "0.343"
        )
        mult_line[2].set_color(CHOOSE_COLOR)
        mult_line[4].set_color(SUCCESS_COLOR)
        mult_line[6].set_color(FAILURE_COLOR)
        mult_line.next_to(choose_result, DOWN, buff=0.6)
        mult_line.shift(RIGHT * 1.5)

        self.play(Write(mult_line), run_time=0.6)
        self.wait(0.5)

        # Final result
        result = MathTex("=", "0.3087")
        result.next_to(mult_line, DOWN, buff=0.3, aligned_edge=RIGHT)
        result.shift(RIGHT * 0.5)

        self.play(Write(result), run_time=0.5)
        self.wait(0.5)

        # Box the result
        result_box = SurroundingRectangle(result, color=YELLOW, buff=0.15)
        self.play(Create(result_box))
        self.wait(0.5)

        # ============ CLEAR FOR KEY INSIGHT ============
        self.play(
            FadeOut(choose_result),
            FadeOut(success_calc),
            FadeOut(failure_calc),
            FadeOut(mult_line),
            FadeOut(result),
            FadeOut(result_box),
            FadeOut(example_title),
            FadeOut(sub_formula),
            run_time=0.6
        )

        # ============ BOXED FORMULA AND KEY INSIGHT ============
        # Center the formula
        final_formula = MathTex(
            "P(X = k)", "=",
            "C(n,k)", r"\times",
            "p^k", r"\times",
            "(1-p)^{n-k}"
        )
        final_formula.scale(1.3)
        final_formula[2].set_color(CHOOSE_COLOR)
        final_formula[4].set_color(SUCCESS_COLOR)
        final_formula[6].set_color(FAILURE_COLOR)
        final_formula.move_to(ORIGIN).shift(UP * 0.5)

        formula_box = SurroundingRectangle(final_formula, color=YELLOW, buff=0.25, corner_radius=0.1)

        self.play(
            ReplacementTransform(formula, final_formula),
            run_time=0.6
        )
        self.play(Create(formula_box))
        self.wait(0.5)

        # Key insight
        key_insight = Text(
            "Multiply: ways × success prob × failure prob",
            font_size=32,
            color=YELLOW
        )
        key_insight.next_to(formula_box, DOWN, buff=0.6)

        self.play(Write(key_insight), run_time=0.8)
        self.wait(2)

        # Fade out
        self.play(
            FadeOut(final_formula),
            FadeOut(formula_box),
            FadeOut(key_insight),
            run_time=0.8
        )
