"""
Manim animation: Simulation Step 1 - Digit Assignment (l07)

This animation demonstrates how to assign digits to match probabilities in simulations.

Render command:
    manim -qm --format=mp4 l07_digit_assignment.py DigitAssignment

Output: DigitAssignment.mp4 (~45 seconds)
"""

from manim import *

class DigitAssignment(Scene):
    def construct(self):
        # Title
        title = Text("Simulation Step 1: Assign Digits", font_size=40, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)

        # Show probability scenario
        scenario = Text("Free throw success = 75%", font_size=32)
        scenario.next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(scenario))
        self.wait(1.5)

        # Create number line/grid (showing 1-100 in a compact grid)
        # We'll show 1-100 as a 10x10 grid for visual clarity
        grid_group = VGroup()
        grid_size = 10
        cell_size = 0.5

        # Create grid with numbers
        for i in range(grid_size):
            for j in range(grid_size):
                num = i * grid_size + j + 1
                cell = Square(side_length=cell_size)
                cell.move_to([j * cell_size - 4.5 * cell_size, -i * cell_size + 4.5 * cell_size - 1.5, 0])

                # Add number label for first, last, and key boundaries
                if num in [1, 10, 75, 76, 100]:
                    label = Text(str(num), font_size=16)
                    label.move_to(cell.get_center())
                    cell_group = VGroup(cell, label)
                else:
                    cell_group = VGroup(cell)

                grid_group.add(cell_group)

        # Scale down and position grid
        grid_group.scale(0.8)
        grid_group.move_to([0, -0.5, 0])

        self.play(Create(grid_group), run_time=2)
        self.wait(1)

        # Color 1-75 GREEN (success)
        success_text = Text("1-75: SUCCESS", font_size=24, color=GREEN)
        success_text.to_edge(LEFT).shift(DOWN * 2.5)

        self.play(Write(success_text))

        # Color cells 1-75 green
        for i in range(75):
            grid_group[i][0].set_fill(GREEN, opacity=0.7)

        self.play(
            *[grid_group[i][0].animate.set_fill(GREEN, opacity=0.7) for i in range(75)],
            run_time=2
        )
        self.wait(1)

        # Color 76-100 RED (failure)
        failure_text = Text("76-100: FAILURE", font_size=24, color=RED)
        failure_text.to_edge(RIGHT).shift(DOWN * 2.5)

        self.play(Write(failure_text))

        # Color cells 76-100 red
        self.play(
            *[grid_group[i][0].animate.set_fill(RED, opacity=0.7) for i in range(75, 100)],
            run_time=2
        )
        self.wait(1.5)

        # Show calculation
        calc = MathTex(r"\frac{75 \text{ digits}}{100 \text{ total}} = 75\%", font_size=36)
        calc.next_to(grid_group, DOWN, buff=0.8)
        self.play(Write(calc))
        self.wait(2)

        # Transition to second example
        self.play(
            FadeOut(scenario),
            FadeOut(grid_group),
            FadeOut(success_text),
            FadeOut(failure_text),
            FadeOut(calc)
        )
        self.wait(0.5)

        # Another example: 30%
        scenario2 = Text("Rain probability = 30%", font_size=32)
        scenario2.next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(scenario2))
        self.wait(1)

        # Create simpler number line for second example
        number_line = NumberLine(
            x_range=[0, 100, 10],
            length=10,
            include_numbers=True,
            numbers_to_include=[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
            font_size=20,
            label_direction=DOWN
        )
        number_line.shift(DOWN * 0.5)

        self.play(Create(number_line))
        self.wait(1)

        # Highlight 1-30 region in green
        success_region = Line(
            number_line.n2p(1), number_line.n2p(30),
            stroke_width=20, color=GREEN
        )
        success_label = Text("1-30: SUCCESS", font_size=24, color=GREEN)
        success_label.next_to(number_line.n2p(15), UP, buff=0.5)

        self.play(Create(success_region), Write(success_label))
        self.wait(1)

        # Highlight 31-100 region in red
        failure_region = Line(
            number_line.n2p(31), number_line.n2p(100),
            stroke_width=20, color=RED
        )
        failure_label = Text("31-100: FAILURE", font_size=24, color=RED)
        failure_label.next_to(number_line.n2p(65), UP, buff=0.5)

        self.play(Create(failure_region), Write(failure_label))
        self.wait(1.5)

        # Show calculation for 30%
        calc2 = MathTex(r"\frac{30 \text{ digits}}{100 \text{ total}} = 30\%", font_size=36)
        calc2.next_to(number_line, DOWN, buff=1)
        self.play(Write(calc2))
        self.wait(2)

        # Clear for key insight
        self.play(
            FadeOut(scenario2),
            FadeOut(number_line),
            FadeOut(success_region),
            FadeOut(failure_region),
            FadeOut(success_label),
            FadeOut(failure_label),
            FadeOut(calc2)
        )
        self.wait(0.5)

        # Key insight
        insight_box = Rectangle(width=10, height=2, color=YELLOW, fill_opacity=0.2)
        insight_box.shift(DOWN * 0.5)

        insight_text = Text(
            "Match digits to probability!",
            font_size=40,
            weight=BOLD,
            color=YELLOW
        )
        insight_text.move_to(insight_box.get_center())

        insight_detail = Text(
            "Number of success digits = Probability percentage",
            font_size=28
        )
        insight_detail.next_to(insight_text, DOWN, buff=0.3)

        self.play(Create(insight_box))
        self.play(Write(insight_text))
        self.wait(0.5)
        self.play(FadeIn(insight_detail))
        self.wait(3)

        # Fade out everything
        self.play(FadeOut(Group(*self.mobjects)))
        self.wait(0.5)
