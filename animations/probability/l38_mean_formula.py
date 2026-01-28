"""
Mean (Expected Value) of Random Variable Animation

Demonstrates the calculation of mean (expected value) using the formula μ = Σ[x · P(x)]
with a concrete example showing weighted average calculation.

To render:
manim -qm --format=mp4 l38_mean_formula.py MeanExpectedValue
"""

from manim import *

class MeanExpectedValue(Scene):
    def construct(self):
        # Title
        title = Text("Mean (Expected Value)", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Formula
        formula = MathTex(r"\mu = \sum [x \cdot P(x)]", font_size=44)
        formula.next_to(title, DOWN, buff=0.5)
        self.play(Write(formula))
        self.wait(1)

        # Distribution table header
        table_title = Text("Example Distribution:", font_size=32)
        table_title.move_to(UP * 1.2)
        self.play(
            title.animate.scale(0.7).to_edge(UP, buff=0.2),
            formula.animate.scale(0.7).next_to(title, DOWN, buff=0.2).to_edge(LEFT, buff=0.5),
            run_time=0.8
        )
        self.play(Write(table_title))

        # Distribution values
        x_values = [1, 2, 3, 4]
        p_values = [0.1, 0.3, 0.4, 0.2]

        # Create table
        x_label = MathTex("X:", font_size=36)
        p_label = MathTex("P(X):", font_size=36)

        x_label.move_to(LEFT * 3 + UP * 0.4)
        p_label.move_to(LEFT * 3 + DOWN * 0.3)

        x_entries = VGroup()
        p_entries = VGroup()

        for i, (x, p) in enumerate(zip(x_values, p_values)):
            x_entry = MathTex(str(x), font_size=36)
            p_entry = MathTex(str(p), font_size=36)

            x_pos = LEFT * 1.5 + RIGHT * i * 1.2 + UP * 0.4
            p_pos = LEFT * 1.5 + RIGHT * i * 1.2 + DOWN * 0.3

            x_entry.move_to(x_pos)
            p_entry.move_to(p_pos)

            x_entries.add(x_entry)
            p_entries.add(p_entry)

        self.play(
            Write(x_label),
            Write(p_label),
            *[Write(x) for x in x_entries],
            *[Write(p) for p in p_entries]
        )
        self.wait(1)

        # Step-by-step calculation
        calc_title = Text("Calculation:", font_size=32)
        calc_title.move_to(LEFT * 4 + DOWN * 1.3)
        self.play(Write(calc_title))

        calculations = []
        products = []
        y_offset = -1.8

        for i, (x, p) in enumerate(zip(x_values, p_values)):
            product = x * p
            products.append(product)
            # Create the calculation text properly
            calc = MathTex(str(x), r"(", str(p), r")", "=", str(product), font_size=32)
            calc.move_to(LEFT * 3.5 + DOWN * (y_offset + i * 0.4))
            calculations.append(calc)

            # Highlight corresponding values in table
            self.play(
                x_entries[i].animate.set_color(YELLOW),
                p_entries[i].animate.set_color(YELLOW),
                run_time=0.3
            )
            self.play(Write(calc), run_time=0.5)
            self.play(
                x_entries[i].animate.set_color(WHITE),
                p_entries[i].animate.set_color(WHITE),
                run_time=0.3
            )

        self.wait(0.5)

        # Sum calculation
        sum_line = Line(LEFT * 4.5 + DOWN * 3.5, LEFT * 1.5 + DOWN * 3.5, color=WHITE)
        sum_value = sum(products)
        sum_calc = MathTex(r"\text{Sum}", "=", str(sum_value), font_size=36, color=GREEN)
        sum_calc.move_to(LEFT * 3 + DOWN * 4)

        self.play(Create(sum_line))
        self.play(Write(sum_calc))
        self.wait(1)

        # Show mean on distribution
        mean_marker = MathTex(r"\mu", "=", "2.7", font_size=36, color=GREEN)
        mean_marker.move_to(RIGHT * 2.5 + UP * 0.8)

        # Create arrow pointing to mean position
        arrow = Arrow(
            start=mean_marker.get_bottom(),
            end=LEFT * 1.5 + RIGHT * 2.04 + UP * 0.4,  # Position between 2 and 3
            color=GREEN,
            buff=0.1
        )

        self.play(
            Write(mean_marker),
            GrowArrow(arrow)
        )
        self.wait(1)

        # Visual representation of balance point
        balance_text = Text("(Balance Point)", font_size=24, color=GREEN)
        balance_text.next_to(mean_marker, DOWN, buff=0.2)
        self.play(Write(balance_text))
        self.wait(1)

        # Key insight
        insight = Text(
            '"The long-run average value"',
            font_size=32,
            color=BLUE,
            slant=ITALIC
        )
        insight.move_to(DOWN * 4.8)

        # Fade out calculation details to make room
        self.play(
            FadeOut(calc_title),
            *[FadeOut(calc) for calc in calculations],
            FadeOut(sum_line),
            sum_calc.animate.move_to(RIGHT * 3 + DOWN * 1.5)
        )

        self.play(Write(insight))
        self.wait(2)

        # Final pause
        self.wait(0.5)
