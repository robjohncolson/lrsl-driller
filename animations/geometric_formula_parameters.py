"""
Geometric Distribution: Formula and Parameters

Render command:
    manim -qm --format=mp4 geometric_formula_parameters.py GeometricFormulaParameters

Target: AP Statistics students
Duration: ~60 seconds
"""

from manim import *


class GeometricFormulaParameters(Scene):
    def construct(self):
        # Color scheme
        FAILURE_COLOR = RED
        SUCCESS_COLOR = GREEN
        WARNING_COLOR = YELLOW
        HIGHLIGHT_COLOR = BLUE

        # ============== TITLE ==============
        title = Text("Geometric Distribution: Formula and Parameters", font_size=36)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # ============== MAIN FORMULA ==============
        formula_label = Text("Probability Formula:", font_size=28)
        formula_label.next_to(title, DOWN, buff=0.5)

        # Main formula with color coding
        formula = MathTex(
            "P(X = x)", "=", "(1-p)^{x-1}", r"\times", "p"
        )
        formula.scale(1.2)
        formula.next_to(formula_label, DOWN, buff=0.4)
        formula[2].set_color(FAILURE_COLOR)  # (1-p)^(x-1)
        formula[4].set_color(SUCCESS_COLOR)  # p

        self.play(Write(formula_label))
        self.play(Write(formula))
        self.wait(0.5)

        # ============== COMPONENT EXPLANATIONS ==============
        # Failure explanation
        failure_box = SurroundingRectangle(formula[2], color=FAILURE_COLOR, buff=0.1)
        failure_text = Text("Probability of (x-1) failures before success", font_size=22, color=FAILURE_COLOR)
        failure_text.next_to(formula, DOWN, buff=0.5)

        self.play(Create(failure_box))
        self.play(Write(failure_text))
        self.wait(0.5)

        # Success explanation
        success_box = SurroundingRectangle(formula[4], color=SUCCESS_COLOR, buff=0.1)
        success_text = Text("Probability of success on trial x", font_size=22, color=SUCCESS_COLOR)
        success_text.next_to(failure_text, DOWN, buff=0.3)

        self.play(ReplacementTransform(failure_box, success_box))
        self.play(Write(success_text))
        self.wait(0.5)

        # ============== CRITICAL WARNING ==============
        self.play(FadeOut(success_box))

        warning_box = Rectangle(
            width=8, height=1.2,
            color=WARNING_COLOR,
            fill_color=WARNING_COLOR,
            fill_opacity=0.2
        )
        warning_box.next_to(success_text, DOWN, buff=0.4)

        warning_icon = Text("⚠", font_size=36, color=WARNING_COLOR)
        warning_msg = Text("Exponent is (x-1), NOT x!", font_size=26, color=WARNING_COLOR)
        warning_group = VGroup(warning_icon, warning_msg).arrange(RIGHT, buff=0.3)
        warning_group.move_to(warning_box.get_center())

        # Highlight the exponent in the formula
        exponent_highlight = SurroundingRectangle(
            formula[2][6:9],  # x-1 portion
            color=WARNING_COLOR,
            buff=0.05
        )

        self.play(
            Create(warning_box),
            Write(warning_group),
            Create(exponent_highlight)
        )
        self.play(
            Flash(exponent_highlight, color=WARNING_COLOR, flash_radius=0.5)
        )
        self.wait(1)

        # ============== CLEAR FOR EXAMPLE ==============
        self.play(
            FadeOut(formula_label),
            FadeOut(failure_text),
            FadeOut(success_text),
            FadeOut(warning_box),
            FadeOut(warning_group),
            FadeOut(exponent_highlight),
            formula.animate.scale(0.8).next_to(title, DOWN, buff=0.3)
        )

        # ============== CONCRETE EXAMPLE ==============
        example_title = Text("Example: p = 0.2, find P(X = 4)", font_size=28, color=HIGHLIGHT_COLOR)
        example_title.next_to(formula, DOWN, buff=0.4)

        example_meaning = Text("(First success on 4th trial)", font_size=22, color=GRAY)
        example_meaning.next_to(example_title, DOWN, buff=0.2)

        self.play(Write(example_title))
        self.play(Write(example_meaning))
        self.wait(0.5)

        # Step-by-step calculation
        calc_step1 = MathTex(
            "P(X=4)", "=", "(1-0.2)^{4-1}", r"\times", "0.2"
        )
        calc_step1[2].set_color(FAILURE_COLOR)
        calc_step1[4].set_color(SUCCESS_COLOR)
        calc_step1.next_to(example_meaning, DOWN, buff=0.4)

        calc_step2 = MathTex(
            "=", "(0.8)^{3}", r"\times", "0.2"
        )
        calc_step2[1].set_color(FAILURE_COLOR)
        calc_step2[3].set_color(SUCCESS_COLOR)
        calc_step2.next_to(calc_step1, DOWN, buff=0.3)

        calc_step3 = MathTex(
            "=", "0.512", r"\times", "0.2"
        )
        calc_step3[1].set_color(FAILURE_COLOR)
        calc_step3[3].set_color(SUCCESS_COLOR)
        calc_step3.next_to(calc_step2, DOWN, buff=0.3)

        calc_step4 = MathTex(
            "=", "0.1024"
        )
        calc_step4[1].set_color(HIGHLIGHT_COLOR)
        calc_step4.next_to(calc_step3, DOWN, buff=0.3)

        self.play(Write(calc_step1))
        self.wait(0.3)
        self.play(Write(calc_step2))
        self.wait(0.3)
        self.play(Write(calc_step3))
        self.wait(0.3)
        self.play(Write(calc_step4))

        # Box the answer
        answer_box = SurroundingRectangle(calc_step4, color=HIGHLIGHT_COLOR, buff=0.15)
        self.play(Create(answer_box))
        self.wait(0.5)

        # ============== CLEAR FOR PARAMETERS ==============
        self.play(
            FadeOut(formula),
            FadeOut(example_title),
            FadeOut(example_meaning),
            FadeOut(calc_step1),
            FadeOut(calc_step2),
            FadeOut(calc_step3),
            FadeOut(calc_step4),
            FadeOut(answer_box)
        )

        # ============== PARAMETERS SECTION ==============
        params_title = Text("Parameters", font_size=32, color=HIGHLIGHT_COLOR)
        params_title.next_to(title, DOWN, buff=0.5)
        self.play(Write(params_title))

        # Mean formula
        mean_label = Text("Mean (Expected Value):", font_size=24)
        mean_formula = MathTex(r"\mu = \frac{1}{p}")
        mean_formula.scale(1.1)
        mean_group = VGroup(mean_label, mean_formula).arrange(RIGHT, buff=0.5)
        mean_group.next_to(params_title, DOWN, buff=0.5)

        mean_example = MathTex(r"\text{Example: } \mu = \frac{1}{0.2} = 5 \text{ trials expected}")
        mean_example.scale(0.85)
        mean_example.next_to(mean_group, DOWN, buff=0.3)
        mean_example.set_color(GRAY)

        self.play(Write(mean_group))
        self.play(Write(mean_example))
        self.wait(0.5)

        # Standard deviation formula
        sd_label = Text("Standard Deviation:", font_size=24)
        sd_formula = MathTex(r"\sigma = \sqrt{\frac{1-p}{p^2}}")
        sd_formula.scale(1.1)
        sd_group = VGroup(sd_label, sd_formula).arrange(RIGHT, buff=0.5)
        sd_group.next_to(mean_example, DOWN, buff=0.5)

        sd_example = MathTex(r"\text{Example: } \sigma = \sqrt{\frac{0.8}{0.04}} = \sqrt{20} \approx 4.47")
        sd_example.scale(0.85)
        sd_example.next_to(sd_group, DOWN, buff=0.3)
        sd_example.set_color(GRAY)

        self.play(Write(sd_group))
        self.play(Write(sd_example))
        self.wait(0.5)

        # ============== CLEAR FOR SUMMARY ==============
        self.play(
            FadeOut(params_title),
            FadeOut(mean_group),
            FadeOut(mean_example),
            FadeOut(sd_group),
            FadeOut(sd_example)
        )

        # ============== BOXED SUMMARY ==============
        summary_title = Text("Summary: Geometric Distribution", font_size=28, color=HIGHLIGHT_COLOR)
        summary_title.next_to(title, DOWN, buff=0.4)

        # Summary formulas
        summary_formulas = VGroup(
            MathTex(r"P(X = x) = (1-p)^{x-1} \cdot p"),
            MathTex(r"\mu = \frac{1}{p}"),
            MathTex(r"\sigma = \sqrt{\frac{1-p}{p^2}}")
        )
        summary_formulas.arrange(DOWN, buff=0.4, aligned_edge=LEFT)
        summary_formulas.next_to(summary_title, DOWN, buff=0.5)

        # Labels for each formula
        labels = VGroup(
            Text("Probability:", font_size=20),
            Text("Mean:", font_size=20),
            Text("Std Dev:", font_size=20)
        )
        for i, label in enumerate(labels):
            label.next_to(summary_formulas[i], LEFT, buff=0.5)

        # Create the summary box
        summary_content = VGroup(summary_formulas, labels)
        summary_box = SurroundingRectangle(
            summary_content,
            color=HIGHLIGHT_COLOR,
            buff=0.3,
            corner_radius=0.1
        )

        self.play(Write(summary_title))
        self.play(Create(summary_box))

        for i in range(3):
            self.play(
                Write(labels[i]),
                Write(summary_formulas[i]),
                run_time=0.5
            )

        self.wait(1)

        # Final fade out
        self.play(
            FadeOut(title),
            FadeOut(summary_title),
            FadeOut(summary_box),
            FadeOut(summary_formulas),
            FadeOut(labels)
        )
