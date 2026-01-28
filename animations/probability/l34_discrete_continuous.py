"""
Discrete vs Continuous Random Variables

Render command:
manim -qm --format=mp4 l34_discrete_continuous.py DiscreteContinuous

This animation visually demonstrates the key difference between discrete and continuous
random variables through number line representations and real-world examples.
"""

from manim import *


class DiscreteContinuous(Scene):
    def construct(self):
        # Title
        title = Text("Discrete vs Continuous", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Create dividing line
        divider = Line(UP * 2.5, DOWN * 3, color=GRAY)
        self.play(Create(divider))

        # LEFT SIDE - DISCRETE
        discrete_label = Text("DISCRETE", font_size=36, color=BLUE, weight=BOLD)
        discrete_label.move_to(LEFT * 3.5 + UP * 2)
        self.play(FadeIn(discrete_label))

        # Discrete number line with dots (gaps)
        discrete_line = Line(LEFT * 6, LEFT * 1, color=WHITE)
        discrete_line.move_to(LEFT * 3.5 + UP * 0.5)

        # Create dots at integer positions
        dots = VGroup()
        labels = VGroup()
        for i in range(6):
            x_pos = discrete_line.get_left()[0] + i * (discrete_line.get_length() / 5)
            dot = Dot(point=[x_pos, discrete_line.get_center()[1], 0], color=BLUE, radius=0.08)
            dots.add(dot)
            label = Text(str(i), font_size=20)
            label.next_to(dot, DOWN, buff=0.2)
            labels.add(label)

        self.play(Create(discrete_line), run_time=0.5)
        self.play(LaggedStart(*[GrowFromCenter(dot) for dot in dots], lag_ratio=0.1))
        self.play(FadeIn(labels))

        # Discrete description
        discrete_desc = Text("Countable values\nwith GAPS", font_size=24, color=BLUE)
        discrete_desc.move_to(LEFT * 3.5 + UP * 0.5 + DOWN * 1.2)
        self.play(FadeIn(discrete_desc))

        # Discrete examples
        discrete_examples = VGroup(
            Text("Examples:", font_size=20, weight=BOLD),
            Text("• # of students", font_size=18),
            Text("• # of cars", font_size=18),
            Text("• Dice rolls", font_size=18)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        discrete_examples.move_to(LEFT * 3.5 + DOWN * 1.8)
        self.play(FadeIn(discrete_examples))

        self.wait(0.5)

        # RIGHT SIDE - CONTINUOUS
        continuous_label = Text("CONTINUOUS", font_size=36, color=RED, weight=BOLD)
        continuous_label.move_to(RIGHT * 3.5 + UP * 2)
        self.play(FadeIn(continuous_label))

        # Continuous number line (solid, no gaps)
        continuous_line = Line(RIGHT * 1, RIGHT * 6, color=RED, stroke_width=8)
        continuous_line.move_to(RIGHT * 3.5 + UP * 0.5)

        # Add tick marks to show it's a measured interval
        tick_marks = VGroup()
        tick_labels = VGroup()
        for i in [0, 5]:
            x_pos = continuous_line.get_left()[0] + i * (continuous_line.get_length() / 5)
            tick = Line(
                [x_pos, continuous_line.get_center()[1] - 0.1, 0],
                [x_pos, continuous_line.get_center()[1] + 0.1, 0],
                color=WHITE
            )
            tick_marks.add(tick)
            label = Text(str(i), font_size=20)
            label.next_to(tick, DOWN, buff=0.2)
            tick_labels.add(label)

        self.play(Create(continuous_line), run_time=1)
        self.play(Create(tick_marks), FadeIn(tick_labels))

        # Continuous description
        continuous_desc = Text("Infinite values\nNO gaps", font_size=24, color=RED)
        continuous_desc.move_to(RIGHT * 3.5 + UP * 0.5 + DOWN * 1.2)
        self.play(FadeIn(continuous_desc))

        # Continuous examples
        continuous_examples = VGroup(
            Text("Examples:", font_size=20, weight=BOLD),
            Text("• Height", font_size=18),
            Text("• Time", font_size=18),
            Text("• Weight", font_size=18)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        continuous_examples.move_to(RIGHT * 3.5 + DOWN * 1.8)
        self.play(FadeIn(continuous_examples))

        self.wait(1)

        # Key question at bottom
        key_question = Text(
            "Can you COUNT the values, or MEASURE them?",
            font_size=28,
            color=YELLOW,
            weight=BOLD
        )
        key_question.to_edge(DOWN, buff=0.3)

        # Highlight box around question
        question_box = SurroundingRectangle(
            key_question,
            color=YELLOW,
            buff=0.2,
            corner_radius=0.1
        )

        self.play(
            Create(question_box),
            Write(key_question),
            run_time=1.5
        )

        self.wait(2)
