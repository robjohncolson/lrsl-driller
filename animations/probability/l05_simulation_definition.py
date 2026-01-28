"""
Simulation Definition Animation (l05)

Explains what a simulation is and why we use it in probability.

Usage:
    manim -qm --format=mp4 l05_simulation_definition.py SimulationDefinition
"""

from manim import *

class SimulationDefinition(Scene):
    def construct(self):
        # Title
        title = Text("What is a Simulation?", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Real-world scenario (basketball free throws)
        real_label = Text("Real World", font_size=32, color=BLUE)
        real_label.shift(UP * 2 + LEFT * 3.5)

        # Basketball icon (circle representing ball)
        basketball = Circle(radius=0.3, color=BLUE, fill_opacity=0.8)
        basketball.shift(UP * 0.8 + LEFT * 3.5)

        # Person shooting (stick figure)
        person = VGroup(
            Circle(radius=0.15, color=BLUE, fill_opacity=1).shift(UP * 0.2),
            Line(UP * 0.05, DOWN * 0.4, color=BLUE, stroke_width=4),
            Line(ORIGIN, UP * 0.2 + LEFT * 0.2, color=BLUE, stroke_width=4).shift(DOWN * 0.1),
            Line(ORIGIN, DOWN * 0.3, color=BLUE, stroke_width=4).shift(DOWN * 0.4 + LEFT * 0.1),
            Line(ORIGIN, DOWN * 0.3, color=BLUE, stroke_width=4).shift(DOWN * 0.4 + RIGHT * 0.1)
        )
        person.shift(LEFT * 3.5 + DOWN * 0.5)

        # Cost/time icons
        dollar = Text("$$$", font_size=24, color=RED)
        clock = Text("⏰", font_size=24)
        costs = VGroup(dollar, clock).arrange(RIGHT, buff=0.3)
        costs.shift(LEFT * 3.5 + DOWN * 1.8)

        real_group = VGroup(real_label, basketball, person, costs)

        self.play(
            FadeIn(real_label),
            DrawBorderThenFill(basketball),
            Create(person),
            FadeIn(costs)
        )
        self.wait(0.5)

        # Arrow
        arrow = Arrow(LEFT * 1.5, RIGHT * 1.5, color=YELLOW, buff=0.2)
        arrow.shift(UP * 0.5)
        transform_text = Text("MODEL", font_size=24, color=YELLOW)
        transform_text.next_to(arrow, UP, buff=0.1)

        self.play(
            GrowArrow(arrow),
            FadeIn(transform_text)
        )
        self.wait(0.3)

        # Simulation model (random numbers)
        sim_label = Text("Simulation", font_size=32, color=GREEN)
        sim_label.shift(UP * 2 + RIGHT * 3.5)

        # Random number generator visualization
        random_nums = VGroup(
            Text("0.73", font_size=28, color=GREEN),
            Text("0.45", font_size=28, color=GREEN),
            Text("0.82", font_size=28, color=GREEN),
            Text("0.61", font_size=28, color=GREEN)
        ).arrange(DOWN, buff=0.2)
        random_nums.shift(RIGHT * 3.5 + UP * 0.3)

        # Computer/code representation
        computer = Rectangle(width=2, height=1.5, color=GREEN, fill_opacity=0.2)
        computer.shift(RIGHT * 3.5 + DOWN * 1.2)
        code_line = Text("random()", font_size=20, color=GREEN)
        code_line.move_to(computer.get_center())

        sim_group = VGroup(sim_label, random_nums, computer, code_line)

        self.play(
            FadeIn(sim_label),
            Write(random_nums),
            Create(computer),
            FadeIn(code_line)
        )
        self.wait(0.5)

        # Show that results match
        match_text = Text("Results Match!", font_size=28, color=YELLOW)
        match_text.shift(DOWN * 2.5)
        checkmark = Text("✓", font_size=48, color=GREEN)
        checkmark.next_to(match_text, RIGHT, buff=0.2)

        self.play(
            FadeIn(match_text),
            FadeIn(checkmark)
        )
        self.wait(0.5)

        # Clear for why we simulate
        self.play(
            FadeOut(real_group),
            FadeOut(arrow),
            FadeOut(transform_text),
            FadeOut(sim_group),
            FadeOut(match_text),
            FadeOut(checkmark)
        )
        self.wait(0.3)

        # Why simulate?
        why_title = Text("Why Use Simulation?", font_size=36, weight=BOLD)
        why_title.shift(UP * 2.5)
        self.play(Transform(title, why_title))
        self.wait(0.3)

        # Reasons in grid
        reasons = VGroup(
            VGroup(
                Text("💰 Expensive", font_size=28, color=RED),
            ),
            VGroup(
                Text("⏰ Time-consuming", font_size=28, color=ORANGE),
            ),
            VGroup(
                Text("⚠️ Dangerous", font_size=28, color=RED),
            ),
            VGroup(
                Text("🚀 Impossible", font_size=28, color=PURPLE),
            )
        ).arrange_in_grid(rows=2, cols=2, buff=1.2)
        reasons.shift(DOWN * 0.3)

        self.play(LaggedStart(*[FadeIn(reason) for reason in reasons], lag_ratio=0.3))
        self.wait(0.8)

        # Key insight
        self.play(FadeOut(reasons))

        insight = Text("Model reality with random numbers", font_size=40, weight=BOLD, color=YELLOW)
        insight.shift(UP * 0.2)

        # Box around insight
        box = SurroundingRectangle(insight, color=YELLOW, buff=0.3, corner_radius=0.2)

        self.play(
            Write(insight),
            Create(box)
        )
        self.wait(1.5)

        # Fade out
        self.play(
            FadeOut(title),
            FadeOut(insight),
            FadeOut(box)
        )
        self.wait(0.3)
