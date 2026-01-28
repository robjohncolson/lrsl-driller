"""
Probability Distribution as Weighted Sum (Mean & Variance)
Shows how to calculate the mean (expected value) of a discrete probability distribution
as a weighted sum, and introduces variance as spread around the mean.

Run with: manim -qm --format=mp4 probability_distribution_metrics.py ProbabilityDistributionMetrics
"""
from manim import *


class ProbabilityDistributionMetrics(Scene):
    def construct(self):
        # Distribution data
        x_values = [1, 2, 3, 4]
        probabilities = [0.1, 0.3, 0.4, 0.2]

        # Title
        title = Text("Mean of a Probability Distribution", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # ========== PART 1: Show the Distribution Table ==========
        table_title = Text("Discrete Probability Distribution", font_size=28)
        table_title.next_to(title, DOWN, buff=0.4)
        self.play(Write(table_title))

        # Create table headers
        header_x = MathTex("X", font_size=32)
        header_p = MathTex("P(X)", font_size=32)

        # Create table content
        table_group = VGroup()

        # Headers row
        header_row = VGroup(header_x, header_p).arrange(RIGHT, buff=1.5)
        table_group.add(header_row)

        # Data rows
        for x, p in zip(x_values, probabilities):
            x_cell = MathTex(str(x), font_size=28)
            p_cell = MathTex(str(p), font_size=28)
            row = VGroup(x_cell, p_cell).arrange(RIGHT, buff=1.5)
            table_group.add(row)

        table_group.arrange(DOWN, buff=0.25, aligned_edge=LEFT)
        table_group.next_to(table_title, DOWN, buff=0.4)
        table_group.shift(LEFT * 4)

        self.play(Write(table_group))
        self.wait(0.5)

        # ========== PART 2: Build Bar Chart ==========
        # Create axes for bar chart
        bar_chart_group = VGroup()

        # Create bars
        bars = VGroup()
        bar_width = 0.6
        bar_scale = 4  # Scale factor for bar heights

        for i, (x, p) in enumerate(zip(x_values, probabilities)):
            bar_height = p * bar_scale
            bar = Rectangle(
                width=bar_width,
                height=bar_height,
                fill_color=BLUE,
                fill_opacity=0.7,
                stroke_color=BLUE,
                stroke_width=2
            )
            bar.move_to(RIGHT * (i * 1.0) + UP * (bar_height / 2))

            # X label below bar
            x_label = MathTex(str(x), font_size=24)
            x_label.next_to(bar, DOWN, buff=0.15)

            # P(x) label on top of bar
            p_label = MathTex(str(p), font_size=20)
            p_label.next_to(bar, UP, buff=0.1)

            bar_group = VGroup(bar, x_label, p_label)
            bars.add(bar_group)

        bars.center()
        bars.shift(RIGHT * 2 + DOWN * 0.3)

        # X-axis label
        x_axis_label = MathTex("X", font_size=28)
        x_axis_label.next_to(bars, DOWN, buff=0.4)

        # Y-axis label
        y_axis_label = MathTex("P(X)", font_size=28)
        y_axis_label.next_to(bars, LEFT, buff=0.5)

        bar_chart_group.add(bars, x_axis_label, y_axis_label)

        self.play(
            LaggedStart(*[GrowFromEdge(bar[0], DOWN) for bar in bars], lag_ratio=0.2),
            run_time=1.5
        )
        self.play(
            *[Write(bar[1]) for bar in bars],  # X labels
            *[Write(bar[2]) for bar in bars],  # P labels
            Write(x_axis_label),
            Write(y_axis_label),
            run_time=0.8
        )
        self.wait(0.5)

        # ========== PART 3: Mean Formula ==========
        # Clear table to make room
        self.play(FadeOut(table_group), FadeOut(table_title))

        # Show mean formula
        mean_formula = MathTex(
            r"\mu = E(X) = \sum x \cdot P(x)",
            font_size=32
        )
        mean_formula.shift(LEFT * 3.5 + UP * 1.5)
        self.play(Write(mean_formula))
        self.wait(0.5)

        # ========== PART 4: Step-by-Step Calculation ==========
        calc_title = Text("Weighted Sum:", font_size=24, color=YELLOW)
        calc_title.next_to(mean_formula, DOWN, buff=0.5)
        calc_title.align_to(mean_formula, LEFT)
        self.play(Write(calc_title))

        # Show each weighted term
        weighted_terms = VGroup()
        products = []

        for i, (x, p) in enumerate(zip(x_values, probabilities)):
            product = x * p
            products.append(product)
            term = MathTex(
                f"{x}", r"\cdot", f"{p}", f"= {product}",
                font_size=26
            )
            term[0].set_color(BLUE)  # x value
            term[2].set_color(YELLOW)  # probability (weight)
            weighted_terms.add(term)

        weighted_terms.arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        weighted_terms.next_to(calc_title, DOWN, buff=0.3)
        weighted_terms.align_to(calc_title, LEFT)

        # Animate each calculation with corresponding bar highlight
        for i, term in enumerate(weighted_terms):
            # Highlight the corresponding bar
            self.play(
                bars[i][0].animate.set_fill(YELLOW, opacity=0.9),
                Write(term),
                run_time=0.6
            )
            self.wait(0.2)
            # Reset bar color
            self.play(
                bars[i][0].animate.set_fill(BLUE, opacity=0.7),
                run_time=0.3
            )

        self.wait(0.5)

        # ========== PART 5: Sum to Get Mean ==========
        # Show the summation
        sum_line = MathTex(
            r"\mu = ",
            "0.1", "+", "0.6", "+", "1.2", "+", "0.8",
            font_size=28
        )
        sum_line.next_to(weighted_terms, DOWN, buff=0.4)
        sum_line.align_to(weighted_terms, LEFT)

        self.play(Write(sum_line))
        self.wait(0.3)

        # Calculate final mean
        mean_value = sum(products)  # Should be 2.7

        final_mean = MathTex(
            r"\mu = " + str(mean_value),
            font_size=36,
            color=GREEN
        )
        final_mean.next_to(sum_line, DOWN, buff=0.3)
        final_mean.align_to(sum_line, LEFT)

        self.play(Write(final_mean))
        self.wait(0.5)

        # ========== PART 6: Show Mean on Distribution (Balance Point) ==========
        # Draw vertical line at mean
        mean_x_position = bars[0][0].get_center()[0] + (mean_value - 1) * 1.0

        mean_line = DashedLine(
            start=UP * 2 + RIGHT * mean_x_position,
            end=DOWN * 0.8 + RIGHT * mean_x_position,
            color=GREEN,
            stroke_width=3
        )
        mean_line.shift(DOWN * 0.3)

        mean_label = MathTex(r"\mu = 2.7", font_size=24, color=GREEN)
        mean_label.next_to(mean_line, UP, buff=0.1)

        self.play(Create(mean_line), Write(mean_label))
        self.wait(0.3)

        # Balance point explanation
        balance_text = Text("(Balance Point)", font_size=18, color=GREEN)
        balance_text.next_to(mean_label, DOWN, buff=0.1)
        self.play(Write(balance_text))
        self.wait(0.5)

        # ========== PART 7: Brief Variance Mention ==========
        # Clear some elements
        self.play(
            FadeOut(weighted_terms),
            FadeOut(calc_title),
            FadeOut(sum_line),
        )

        # Variance intro
        variance_title = Text("Variance: Spread Around the Mean", font_size=26, color=YELLOW)
        variance_title.next_to(mean_formula, DOWN, buff=0.5)
        variance_title.align_to(mean_formula, LEFT)
        self.play(Write(variance_title))

        variance_formula = MathTex(
            r"\sigma^2 = \sum (x - \mu)^2 \cdot P(x)",
            font_size=28
        )
        variance_formula.next_to(variance_title, DOWN, buff=0.3)
        variance_formula.align_to(variance_title, LEFT)
        self.play(Write(variance_formula))

        variance_desc = Text(
            "Measures how spread out values are from the mean",
            font_size=20
        )
        variance_desc.next_to(variance_formula, DOWN, buff=0.2)
        variance_desc.align_to(variance_formula, LEFT)
        self.play(Write(variance_desc))
        self.wait(0.5)

        # ========== PART 8: Boxed Summary ==========
        # Clear for final summary
        self.play(
            FadeOut(bars),
            FadeOut(x_axis_label),
            FadeOut(y_axis_label),
            FadeOut(mean_line),
            FadeOut(mean_label),
            FadeOut(balance_text),
            FadeOut(mean_formula),
            FadeOut(variance_title),
            FadeOut(variance_formula),
            FadeOut(variance_desc),
            FadeOut(final_mean),
        )

        # Final summary box
        summary_title = Text("Key Formulas", font_size=32, color=GREEN)
        summary_title.next_to(title, DOWN, buff=0.6)
        self.play(Write(summary_title))

        summary = VGroup(
            MathTex(r"\text{Mean (Expected Value):}", font_size=28),
            MathTex(r"\mu = E(X) = \sum x \cdot P(x)", font_size=32, color=BLUE),
            MathTex(r"\text{Variance:}", font_size=28),
            MathTex(r"\sigma^2 = \sum (x - \mu)^2 \cdot P(x)", font_size=32, color=BLUE),
        ).arrange(DOWN, buff=0.3)
        summary.next_to(summary_title, DOWN, buff=0.5)

        for item in summary:
            self.play(Write(item), run_time=0.5)

        # Box the formulas
        box = SurroundingRectangle(summary, color=GREEN, buff=0.3, corner_radius=0.1)
        self.play(Create(box))

        # Key insight
        insight = Text(
            "The mean is a weighted average where probabilities are the weights!",
            font_size=24,
            color=YELLOW
        )
        insight.to_edge(DOWN, buff=0.5)
        self.play(Write(insight))
        self.wait(2)


class VarianceCalculation(Scene):
    """Bonus scene: Full variance calculation example"""
    def construct(self):
        # Distribution data
        x_values = [1, 2, 3, 4]
        probabilities = [0.1, 0.3, 0.4, 0.2]
        mean = 2.7

        title = Text("Variance Calculation", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Show formula
        formula = MathTex(
            r"\sigma^2 = \sum (x - \mu)^2 \cdot P(x)",
            font_size=32
        )
        formula.next_to(title, DOWN, buff=0.4)
        self.play(Write(formula))

        mean_given = MathTex(r"\mu = 2.7", font_size=28, color=GREEN)
        mean_given.next_to(formula, DOWN, buff=0.3)
        self.play(Write(mean_given))
        self.wait(0.5)

        # Build calculation table
        calc_header = MathTex(
            r"x", r"\quad", r"x - \mu", r"\quad", r"(x-\mu)^2", r"\quad", r"P(x)", r"\quad", r"(x-\mu)^2 \cdot P(x)",
            font_size=22
        )
        calc_header.next_to(mean_given, DOWN, buff=0.5)
        self.play(Write(calc_header))

        # Calculate each row
        rows = VGroup()
        variance_terms = []

        for x, p in zip(x_values, probabilities):
            deviation = x - mean
            sq_deviation = deviation ** 2
            weighted = sq_deviation * p
            variance_terms.append(weighted)

            row = MathTex(
                f"{x}", r"\quad",
                f"{deviation:.1f}", r"\quad",
                f"{sq_deviation:.2f}", r"\quad",
                f"{p}", r"\quad",
                f"{weighted:.3f}",
                font_size=20
            )
            rows.add(row)

        rows.arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        rows.next_to(calc_header, DOWN, buff=0.3)

        for row in rows:
            self.play(Write(row), run_time=0.5)

        self.wait(0.5)

        # Sum for variance
        variance = sum(variance_terms)

        variance_result = MathTex(
            r"\sigma^2 = " + " + ".join([f"{v:.3f}" for v in variance_terms]) + f" = {variance:.2f}",
            font_size=24
        )
        variance_result.next_to(rows, DOWN, buff=0.4)
        self.play(Write(variance_result))

        # Standard deviation
        import math
        std_dev = math.sqrt(variance)

        std_result = MathTex(
            r"\sigma = \sqrt{" + f"{variance:.2f}" + r"} \approx " + f"{std_dev:.2f}",
            font_size=28,
            color=GREEN
        )
        std_result.next_to(variance_result, DOWN, buff=0.3)
        self.play(Write(std_result))

        # Box final results
        final_box = VGroup(variance_result, std_result)
        box = SurroundingRectangle(final_box, color=GREEN, buff=0.2)
        self.play(Create(box))
        self.wait(2)
