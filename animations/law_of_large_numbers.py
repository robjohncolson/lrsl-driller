"""
Law of Large Numbers (Convergence Over Time)

Demonstrates how empirical probability converges to theoretical probability
as the number of trials increases. Uses a coin flip experiment simulation.

Run with: manim -qm --format=mp4 law_of_large_numbers.py LawOfLargeNumbers
"""
from manim import *
import random
import numpy as np


class LawOfLargeNumbers(Scene):
    def construct(self):
        # Set random seed for reproducibility
        random.seed(42)
        np.random.seed(42)

        # Colors
        EMPIRICAL_COLOR = BLUE
        THEORETICAL_COLOR = GREEN

        # Title
        title = Text("Law of Large Numbers", font_size=48)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # Subtitle
        subtitle = Text("Coin Flip Experiment", font_size=28, color=GRAY)
        subtitle.next_to(title, DOWN, buff=0.2)
        self.play(Write(subtitle))
        self.wait(0.5)

        # Generate all coin flips upfront (1 = heads, 0 = tails)
        total_flips = 200
        flips = [random.choice([0, 1]) for _ in range(total_flips)]

        # Calculate running proportion of heads
        running_proportions = []
        heads_count = 0
        for i, flip in enumerate(flips):
            heads_count += flip
            running_proportions.append(heads_count / (i + 1))

        # Create axes for the graph
        axes = Axes(
            x_range=[0, 220, 50],
            y_range=[0, 1.1, 0.25],
            x_length=9,
            y_length=4,
            axis_config={"include_tip": False, "include_numbers": True},
            x_axis_config={"numbers_to_include": [10, 50, 100, 150, 200]},
            y_axis_config={"numbers_to_include": [0, 0.25, 0.5, 0.75, 1.0]},
        )
        axes.shift(DOWN * 0.8)

        # Axis labels
        x_label = Text("Number of Trials", font_size=20)
        x_label.next_to(axes.x_axis, DOWN, buff=0.3)

        y_label = Text("Proportion of Heads", font_size=20)
        y_label.rotate(PI / 2)
        y_label.next_to(axes.y_axis, LEFT, buff=0.4)

        self.play(Create(axes), Write(x_label), Write(y_label))
        self.wait(0.3)

        # Draw theoretical probability line (p = 0.5)
        theoretical_line = DashedLine(
            axes.c2p(0, 0.5),
            axes.c2p(210, 0.5),
            color=THEORETICAL_COLOR,
            stroke_width=3,
        )

        theoretical_label = Text("Theoretical: p = 0.5", font_size=18, color=THEORETICAL_COLOR)
        theoretical_label.next_to(axes.c2p(210, 0.5), RIGHT, buff=0.2)

        self.play(Create(theoretical_line), Write(theoretical_label))
        self.wait(0.5)

        # Create proportion display
        proportion_display = VGroup()
        trials_text = Text("Trials: 0", font_size=24)
        heads_text = Text("Heads: 0", font_size=24)
        prop_text = Text("Proportion: --", font_size=24, color=EMPIRICAL_COLOR)

        proportion_display.add(trials_text, heads_text, prop_text)
        proportion_display.arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        proportion_display.to_corner(UR, buff=0.5)

        self.play(Write(proportion_display))
        self.wait(0.3)

        # Create the empirical line path
        line_points = []

        # Phase 1: First 10 trials (show individual flips)
        phase1_label = Text("Phase 1: Few Trials", font_size=22, color=YELLOW)
        phase1_label.to_edge(DOWN, buff=0.3)
        self.play(Write(phase1_label))

        current_heads = 0
        for i in range(10):
            current_heads += flips[i]
            current_prop = current_heads / (i + 1)
            line_points.append(axes.c2p(i + 1, current_prop))

            # Update display
            new_trials = Text(f"Trials: {i + 1}", font_size=24)
            new_heads = Text(f"Heads: {current_heads}", font_size=24)
            new_prop = Text(f"Proportion: {current_prop:.2f}", font_size=24, color=EMPIRICAL_COLOR)

            new_display = VGroup(new_trials, new_heads, new_prop)
            new_display.arrange(DOWN, buff=0.15, aligned_edge=LEFT)
            new_display.to_corner(UR, buff=0.5)

            # Draw line segment
            if len(line_points) >= 2:
                segment = Line(
                    line_points[-2], line_points[-1],
                    color=EMPIRICAL_COLOR, stroke_width=3
                )
                self.play(
                    Create(segment),
                    Transform(proportion_display, new_display),
                    run_time=0.25
                )
            else:
                # First point - draw dot
                dot = Dot(line_points[0], color=EMPIRICAL_COLOR, radius=0.06)
                self.play(
                    FadeIn(dot),
                    Transform(proportion_display, new_display),
                    run_time=0.25
                )

        # Annotation for 10 trials
        prop_10 = current_heads / 10
        marker_10 = Dot(axes.c2p(10, prop_10), color=YELLOW, radius=0.1)
        annotation_10 = Text(f"n=10: {prop_10:.1%}", font_size=18, color=YELLOW)
        annotation_10.next_to(marker_10, UP, buff=0.15)

        self.play(FadeIn(marker_10), Write(annotation_10))
        self.wait(0.5)

        # Phase 2: Trials 11-50 (faster animation)
        self.play(FadeOut(phase1_label))
        phase2_label = Text("Phase 2: More Trials", font_size=22, color=YELLOW)
        phase2_label.to_edge(DOWN, buff=0.3)
        self.play(Write(phase2_label))

        # Create remaining line in batches
        for i in range(10, 50):
            current_heads += flips[i]
            current_prop = current_heads / (i + 1)
            line_points.append(axes.c2p(i + 1, current_prop))

        # Draw the line from trial 10 to 50
        line_10_to_50 = VMobject(color=EMPIRICAL_COLOR, stroke_width=3)
        line_10_to_50.set_points_as_corners(line_points[9:])

        # Update display for 50 trials
        new_trials = Text(f"Trials: 50", font_size=24)
        new_heads = Text(f"Heads: {current_heads}", font_size=24)
        current_prop = current_heads / 50
        new_prop = Text(f"Proportion: {current_prop:.2f}", font_size=24, color=EMPIRICAL_COLOR)

        new_display = VGroup(new_trials, new_heads, new_prop)
        new_display.arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        new_display.to_corner(UR, buff=0.5)

        self.play(
            Create(line_10_to_50),
            Transform(proportion_display, new_display),
            run_time=1.5
        )

        # Annotation for 50 trials
        prop_50 = current_heads / 50
        marker_50 = Dot(axes.c2p(50, prop_50), color=YELLOW, radius=0.1)
        annotation_50 = Text(f"n=50: {prop_50:.1%}", font_size=18, color=YELLOW)
        annotation_50.next_to(marker_50, UP, buff=0.15)

        self.play(FadeIn(marker_50), Write(annotation_50))
        self.wait(0.5)

        # Phase 3: Trials 51-200 (showing convergence)
        self.play(FadeOut(phase2_label))
        phase3_label = Text("Phase 3: Many Trials - Convergence!", font_size=22, color=YELLOW)
        phase3_label.to_edge(DOWN, buff=0.3)
        self.play(Write(phase3_label))

        # Calculate remaining points
        for i in range(50, 200):
            current_heads += flips[i]
            current_prop = current_heads / (i + 1)
            line_points.append(axes.c2p(i + 1, current_prop))

        # Draw the line from trial 50 to 200
        line_50_to_200 = VMobject(color=EMPIRICAL_COLOR, stroke_width=3)
        line_50_to_200.set_points_as_corners(line_points[49:])

        # Update display for 200 trials
        new_trials = Text(f"Trials: 200", font_size=24)
        new_heads = Text(f"Heads: {current_heads}", font_size=24)
        current_prop = current_heads / 200
        new_prop = Text(f"Proportion: {current_prop:.3f}", font_size=24, color=EMPIRICAL_COLOR)

        new_display = VGroup(new_trials, new_heads, new_prop)
        new_display.arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        new_display.to_corner(UR, buff=0.5)

        self.play(
            Create(line_50_to_200),
            Transform(proportion_display, new_display),
            run_time=2
        )

        # Annotation for 200 trials
        prop_200 = current_heads / 200
        marker_200 = Dot(axes.c2p(200, prop_200), color=YELLOW, radius=0.1)
        annotation_200 = Text(f"n=200: {prop_200:.1%}", font_size=18, color=YELLOW)
        annotation_200.next_to(marker_200, UP, buff=0.15)

        self.play(FadeIn(marker_200), Write(annotation_200))
        self.wait(0.5)

        # Highlight convergence - draw bracket showing how close we are to 0.5
        convergence_arrow = Arrow(
            axes.c2p(200, prop_200),
            axes.c2p(200, 0.5),
            color=WHITE,
            stroke_width=2,
            buff=0.1
        )
        diff_text = Text(f"Difference: {abs(prop_200 - 0.5):.3f}", font_size=16)
        diff_text.next_to(convergence_arrow, RIGHT, buff=0.1)

        self.play(Create(convergence_arrow), Write(diff_text))
        self.wait(0.5)

        # Legend
        legend = VGroup()
        emp_line_sample = Line(LEFT * 0.4, RIGHT * 0.4, color=EMPIRICAL_COLOR, stroke_width=3)
        emp_text = Text("Empirical (observed)", font_size=16, color=EMPIRICAL_COLOR)
        emp_group = VGroup(emp_line_sample, emp_text).arrange(RIGHT, buff=0.2)

        theo_line_sample = DashedLine(LEFT * 0.4, RIGHT * 0.4, color=THEORETICAL_COLOR, stroke_width=3)
        theo_text = Text("Theoretical (p = 0.5)", font_size=16, color=THEORETICAL_COLOR)
        theo_group = VGroup(theo_line_sample, theo_text).arrange(RIGHT, buff=0.2)

        legend.add(emp_group, theo_group)
        legend.arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        legend.to_corner(UL, buff=0.5)
        legend.shift(DOWN * 0.8)

        self.play(FadeIn(legend))
        self.wait(0.5)

        # Clear for key insight
        self.play(
            FadeOut(phase3_label),
            FadeOut(convergence_arrow),
            FadeOut(diff_text),
            FadeOut(annotation_10),
            FadeOut(annotation_50),
            FadeOut(annotation_200),
            FadeOut(marker_10),
            FadeOut(marker_50),
            FadeOut(marker_200),
        )

        # Key insight box
        insight_text = VGroup(
            Text("Key Insight:", font_size=24, color=YELLOW),
            Text("As trials increase,", font_size=22),
            MathTex(
                r"\text{Empirical Probability} \rightarrow \text{Theoretical Probability}",
                font_size=28
            ),
        ).arrange(DOWN, buff=0.15)
        insight_text.to_edge(DOWN, buff=0.5)

        box = SurroundingRectangle(insight_text, color=YELLOW, buff=0.2, corner_radius=0.1)

        self.play(Write(insight_text), Create(box))
        self.wait(2)


class LawOfLargeNumbersExtended(Scene):
    """
    Extended version showing multiple simulation runs to emphasize
    that different sequences all converge to the same value.

    Run with: manim -qm --format=mp4 law_of_large_numbers.py LawOfLargeNumbersExtended
    """
    def construct(self):
        # Colors for multiple runs
        RUN_COLORS = [BLUE, RED, ORANGE, PURPLE, TEAL]
        THEORETICAL_COLOR = GREEN

        # Title
        title = Text("Law of Large Numbers: Multiple Runs", font_size=44)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))

        subtitle = Text("5 different coin flip sequences", font_size=24, color=GRAY)
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.3)

        # Create axes
        axes = Axes(
            x_range=[0, 110, 25],
            y_range=[0, 1.1, 0.25],
            x_length=10,
            y_length=5,
            axis_config={"include_tip": False, "include_numbers": True},
            x_axis_config={"numbers_to_include": [25, 50, 75, 100]},
            y_axis_config={"numbers_to_include": [0, 0.25, 0.5, 0.75, 1.0]},
        )
        axes.shift(DOWN * 0.5)

        x_label = Text("Number of Trials", font_size=18)
        x_label.next_to(axes.x_axis, DOWN, buff=0.25)

        y_label = Text("Proportion of Heads", font_size=18)
        y_label.rotate(PI / 2)
        y_label.next_to(axes.y_axis, LEFT, buff=0.35)

        self.play(Create(axes), Write(x_label), Write(y_label))

        # Draw theoretical probability line
        theoretical_line = DashedLine(
            axes.c2p(0, 0.5),
            axes.c2p(105, 0.5),
            color=THEORETICAL_COLOR,
            stroke_width=4,
        )

        theoretical_label = Text("p = 0.5", font_size=16, color=THEORETICAL_COLOR)
        theoretical_label.next_to(axes.c2p(105, 0.5), RIGHT, buff=0.1)

        self.play(Create(theoretical_line), Write(theoretical_label))
        self.wait(0.3)

        # Generate 5 different simulation runs
        num_runs = 5
        num_flips = 100

        all_lines = VGroup()

        for run in range(num_runs):
            np.random.seed(run * 17 + 3)  # Different seed for each run

            flips = np.random.choice([0, 1], size=num_flips)
            cumsum = np.cumsum(flips)
            proportions = cumsum / np.arange(1, num_flips + 1)

            # Create points for the line
            points = [axes.c2p(i + 1, proportions[i]) for i in range(num_flips)]

            line = VMobject(color=RUN_COLORS[run], stroke_width=2.5, stroke_opacity=0.8)
            line.set_points_as_corners(points)
            all_lines.add(line)

        # Animate all lines being drawn simultaneously
        self.play(
            *[Create(line) for line in all_lines],
            run_time=3
        )
        self.wait(0.5)

        # Highlight convergence region
        convergence_region = Rectangle(
            width=1.5, height=2,
            stroke_color=YELLOW, stroke_width=3,
            fill_opacity=0
        )
        convergence_region.move_to(axes.c2p(95, 0.5))

        self.play(Create(convergence_region))

        # Convergence annotation
        convergence_note = Text(
            "All runs converge\nto p = 0.5!",
            font_size=20,
            color=YELLOW
        )
        convergence_note.next_to(convergence_region, UP, buff=0.2)
        self.play(Write(convergence_note))
        self.wait(1)

        # Key insight
        insight = VGroup(
            Text("Regardless of starting variation,", font_size=22),
            Text("all sequences converge to the true probability.", font_size=22, color=YELLOW),
        ).arrange(DOWN, buff=0.1)
        insight.to_edge(DOWN, buff=0.3)

        box = SurroundingRectangle(insight, color=WHITE, buff=0.15)
        self.play(Write(insight), Create(box))

        self.wait(2)
