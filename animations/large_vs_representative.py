"""
Large Sample vs Representative Sample Misconception

Dispels the common misconception: "Bigger sample = more representative"
Key insight: A BIASED sample stays biased no matter how large!

Run with: manim -qm --format=mp4 large_vs_representative.py LargeVsRepresentativeSample
"""
from manim import *
import random
import numpy as np


class LargeVsRepresentativeSample(Scene):
    def construct(self):
        # Set random seed for reproducibility
        random.seed(42)
        np.random.seed(42)

        # Colors
        BIASED_COLOR = RED
        RANDOM_COLOR = GREEN
        TRUE_VALUE_COLOR = YELLOW

        # Title
        title = Text("Does a Larger Sample Fix Bias?", font_size=44)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # Create the number line (representing true population parameter)
        # True value is at center (0), biased samples cluster to the right
        true_value = 0
        bias_offset = 2.5  # How far biased samples are from truth

        # Create two side-by-side panels
        left_title = Text("Biased Sampling", font_size=28, color=BIASED_COLOR)
        left_title.move_to(UP * 2 + LEFT * 3.5)
        left_subtitle = Text("(voluntary response)", font_size=20, color=GRAY)
        left_subtitle.next_to(left_title, DOWN, buff=0.1)

        right_title = Text("Random Sampling", font_size=28, color=RANDOM_COLOR)
        right_title.move_to(UP * 2 + RIGHT * 3.5)
        right_subtitle = Text("(simple random sample)", font_size=20, color=GRAY)
        right_subtitle.next_to(right_title, DOWN, buff=0.1)

        self.play(
            Write(left_title), Write(left_subtitle),
            Write(right_title), Write(right_subtitle)
        )
        self.wait(0.5)

        # Create number lines for each panel
        # Left panel number line
        left_line = NumberLine(
            x_range=[-1, 5, 1],
            length=5,
            include_numbers=False,
            include_tip=False,
            stroke_width=2
        )
        left_line.move_to(LEFT * 3.5 + DOWN * 0.5)

        # Right panel number line
        right_line = NumberLine(
            x_range=[-1, 5, 1],
            length=5,
            include_numbers=False,
            include_tip=False,
            stroke_width=2
        )
        right_line.move_to(RIGHT * 3.5 + DOWN * 0.5)

        self.play(Create(left_line), Create(right_line))

        # Mark true value on both lines (at position 2 on the number line)
        true_pos_left = left_line.n2p(2)
        true_pos_right = right_line.n2p(2)

        true_marker_left = Triangle(fill_opacity=1, color=TRUE_VALUE_COLOR)
        true_marker_left.scale(0.15)
        true_marker_left.rotate(PI)
        true_marker_left.move_to(true_pos_left + UP * 0.3)

        true_marker_right = Triangle(fill_opacity=1, color=TRUE_VALUE_COLOR)
        true_marker_right.scale(0.15)
        true_marker_right.rotate(PI)
        true_marker_right.move_to(true_pos_right + UP * 0.3)

        true_label_left = Text("True Value", font_size=16, color=TRUE_VALUE_COLOR)
        true_label_left.next_to(true_marker_left, UP, buff=0.1)

        true_label_right = Text("True Value", font_size=16, color=TRUE_VALUE_COLOR)
        true_label_right.next_to(true_marker_right, UP, buff=0.1)

        self.play(
            FadeIn(true_marker_left), Write(true_label_left),
            FadeIn(true_marker_right), Write(true_label_right)
        )
        self.wait(0.5)

        # Sample size labels
        left_size_label = Text("n = 0", font_size=20)
        left_size_label.move_to(LEFT * 3.5 + DOWN * 1.3)

        right_size_label = Text("n = 0", font_size=20)
        right_size_label.move_to(RIGHT * 3.5 + DOWN * 1.3)

        self.play(Write(left_size_label), Write(right_size_label))

        # Create dots for samples
        left_dots = VGroup()
        right_dots = VGroup()

        # Estimate markers (will show sample mean)
        left_estimate_line = Line(
            start=UP * 0.4, end=DOWN * 0.4,
            color=BIASED_COLOR, stroke_width=4
        )
        left_estimate_line.move_to(left_line.n2p(2))  # Start at true value

        right_estimate_line = Line(
            start=UP * 0.4, end=DOWN * 0.4,
            color=RANDOM_COLOR, stroke_width=4
        )
        right_estimate_line.move_to(right_line.n2p(2))  # Start at true value

        left_est_label = Text("Estimate", font_size=14, color=BIASED_COLOR)
        left_est_label.next_to(left_estimate_line, DOWN, buff=0.1)

        right_est_label = Text("Estimate", font_size=14, color=RANDOM_COLOR)
        right_est_label.next_to(right_estimate_line, DOWN, buff=0.1)

        # Phase 1: Small samples (n = 10)
        phase1_text = Text("Small Sample (n = 10)", font_size=24, color=WHITE)
        phase1_text.to_edge(DOWN, buff=0.8)
        self.play(Write(phase1_text))

        # Generate biased samples (clustered around 3.5, away from true value 2)
        biased_values_small = [random.gauss(3.5, 0.4) for _ in range(10)]
        # Generate random samples (clustered around true value 2)
        random_values_small = [random.gauss(2, 0.5) for _ in range(10)]

        # Add dots one by one
        for i in range(10):
            # Biased dot
            biased_x = left_line.n2p(biased_values_small[i])[0]
            biased_y = left_line.get_center()[1] + random.uniform(-0.15, 0.15)
            biased_dot = Dot(point=[biased_x, biased_y, 0], radius=0.06, color=BIASED_COLOR)
            left_dots.add(biased_dot)

            # Random dot
            random_x = right_line.n2p(random_values_small[i])[0]
            random_y = right_line.get_center()[1] + random.uniform(-0.15, 0.15)
            random_dot = Dot(point=[random_x, random_y, 0], radius=0.06, color=RANDOM_COLOR)
            right_dots.add(random_dot)

            # Update size labels
            new_left_label = Text(f"n = {i+1}", font_size=20)
            new_left_label.move_to(LEFT * 3.5 + DOWN * 1.3)
            new_right_label = Text(f"n = {i+1}", font_size=20)
            new_right_label.move_to(RIGHT * 3.5 + DOWN * 1.3)

            self.play(
                FadeIn(biased_dot), FadeIn(random_dot),
                Transform(left_size_label, new_left_label),
                Transform(right_size_label, new_right_label),
                run_time=0.15
            )

        # Show estimates
        biased_mean_small = sum(biased_values_small) / len(biased_values_small)
        random_mean_small = sum(random_values_small) / len(random_values_small)

        left_estimate_line.move_to(left_line.n2p(biased_mean_small))
        right_estimate_line.move_to(right_line.n2p(random_mean_small))

        self.play(
            Create(left_estimate_line), Write(left_est_label),
            Create(right_estimate_line), Write(right_est_label)
        )

        # Annotations for small sample
        small_biased_note = Text("Biased! Far from truth", font_size=16, color=BIASED_COLOR)
        small_biased_note.next_to(left_estimate_line, DOWN, buff=0.4)

        small_random_note = Text("Close to truth!", font_size=16, color=RANDOM_COLOR)
        small_random_note.next_to(right_estimate_line, DOWN, buff=0.4)

        self.play(Write(small_biased_note), Write(small_random_note))
        self.wait(1)

        # Phase 2: Medium samples (n = 30)
        self.play(
            FadeOut(phase1_text), FadeOut(small_biased_note), FadeOut(small_random_note)
        )

        phase2_text = Text("Medium Sample (n = 30)", font_size=24, color=WHITE)
        phase2_text.to_edge(DOWN, buff=0.8)
        self.play(Write(phase2_text))

        # Add more biased and random samples
        biased_values_medium = biased_values_small + [random.gauss(3.5, 0.4) for _ in range(20)]
        random_values_medium = random_values_small + [random.gauss(2, 0.5) for _ in range(20)]

        for i in range(10, 30):
            # Biased dot
            biased_x = left_line.n2p(biased_values_medium[i])[0]
            biased_y = left_line.get_center()[1] + random.uniform(-0.2, 0.2)
            biased_dot = Dot(point=[biased_x, biased_y, 0], radius=0.05, color=BIASED_COLOR)
            left_dots.add(biased_dot)

            # Random dot
            random_x = right_line.n2p(random_values_medium[i])[0]
            random_y = right_line.get_center()[1] + random.uniform(-0.2, 0.2)
            random_dot = Dot(point=[random_x, random_y, 0], radius=0.05, color=RANDOM_COLOR)
            right_dots.add(random_dot)

            # Update size labels
            new_left_label = Text(f"n = {i+1}", font_size=20)
            new_left_label.move_to(LEFT * 3.5 + DOWN * 1.3)
            new_right_label = Text(f"n = {i+1}", font_size=20)
            new_right_label.move_to(RIGHT * 3.5 + DOWN * 1.3)

            self.play(
                FadeIn(biased_dot), FadeIn(random_dot),
                Transform(left_size_label, new_left_label),
                Transform(right_size_label, new_right_label),
                run_time=0.08
            )

        # Update estimates
        biased_mean_medium = sum(biased_values_medium) / len(biased_values_medium)
        random_mean_medium = sum(random_values_medium) / len(random_values_medium)

        self.play(
            left_estimate_line.animate.move_to(left_line.n2p(biased_mean_medium)),
            right_estimate_line.animate.move_to(right_line.n2p(random_mean_medium)),
            left_est_label.animate.next_to(left_line.n2p(biased_mean_medium), DOWN, buff=0.5),
            right_est_label.animate.next_to(right_line.n2p(random_mean_medium), DOWN, buff=0.5),
        )

        med_biased_note = Text("STILL biased!", font_size=16, color=BIASED_COLOR)
        med_biased_note.next_to(left_estimate_line, DOWN, buff=0.4)

        med_random_note = Text("Still accurate", font_size=16, color=RANDOM_COLOR)
        med_random_note.next_to(right_estimate_line, DOWN, buff=0.4)

        self.play(Write(med_biased_note), Write(med_random_note))
        self.wait(0.8)

        # Phase 3: Large samples (n = 100)
        self.play(
            FadeOut(phase2_text), FadeOut(med_biased_note), FadeOut(med_random_note)
        )

        phase3_text = Text("Large Sample (n = 100)", font_size=24, color=WHITE)
        phase3_text.to_edge(DOWN, buff=0.8)
        self.play(Write(phase3_text))

        # Add many more samples quickly
        biased_values_large = biased_values_medium + [random.gauss(3.5, 0.4) for _ in range(70)]
        random_values_large = random_values_medium + [random.gauss(2, 0.5) for _ in range(70)]

        # Add remaining dots in batches
        batch_size = 10
        for batch_start in range(30, 100, batch_size):
            batch_biased = []
            batch_random = []

            for i in range(batch_start, min(batch_start + batch_size, 100)):
                # Biased dot
                biased_x = left_line.n2p(biased_values_large[i])[0]
                biased_y = left_line.get_center()[1] + random.uniform(-0.25, 0.25)
                biased_dot = Dot(point=[biased_x, biased_y, 0], radius=0.04, color=BIASED_COLOR)
                left_dots.add(biased_dot)
                batch_biased.append(FadeIn(biased_dot))

                # Random dot
                random_x = right_line.n2p(random_values_large[i])[0]
                random_y = right_line.get_center()[1] + random.uniform(-0.25, 0.25)
                random_dot = Dot(point=[random_x, random_y, 0], radius=0.04, color=RANDOM_COLOR)
                right_dots.add(random_dot)
                batch_random.append(FadeIn(random_dot))

            # Update size labels
            new_left_label = Text(f"n = {min(batch_start + batch_size, 100)}", font_size=20)
            new_left_label.move_to(LEFT * 3.5 + DOWN * 1.3)
            new_right_label = Text(f"n = {min(batch_start + batch_size, 100)}", font_size=20)
            new_right_label.move_to(RIGHT * 3.5 + DOWN * 1.3)

            self.play(
                *batch_biased, *batch_random,
                Transform(left_size_label, new_left_label),
                Transform(right_size_label, new_right_label),
                run_time=0.2
            )

        # Final estimates
        biased_mean_large = sum(biased_values_large) / len(biased_values_large)
        random_mean_large = sum(random_values_large) / len(random_values_large)

        self.play(
            left_estimate_line.animate.move_to(left_line.n2p(biased_mean_large)),
            right_estimate_line.animate.move_to(right_line.n2p(random_mean_large)),
            left_est_label.animate.next_to(left_line.n2p(biased_mean_large), DOWN, buff=0.5),
            right_est_label.animate.next_to(right_line.n2p(random_mean_large), DOWN, buff=0.5),
        )

        # Final annotations with emphasis
        large_biased_note = Text("100 samples, STILL BIASED!", font_size=18, color=BIASED_COLOR)
        large_biased_note.next_to(left_estimate_line, DOWN, buff=0.4)

        large_random_note = Text("More precise!", font_size=18, color=RANDOM_COLOR)
        large_random_note.next_to(right_estimate_line, DOWN, buff=0.4)

        self.play(Write(large_biased_note), Write(large_random_note))
        self.wait(1)

        # Clear for conclusion
        self.play(
            FadeOut(phase3_text),
            FadeOut(large_biased_note), FadeOut(large_random_note),
            FadeOut(left_dots), FadeOut(right_dots),
            FadeOut(left_estimate_line), FadeOut(right_estimate_line),
            FadeOut(left_est_label), FadeOut(right_est_label),
            FadeOut(left_size_label), FadeOut(right_size_label),
            FadeOut(left_line), FadeOut(right_line),
            FadeOut(true_marker_left), FadeOut(true_marker_right),
            FadeOut(true_label_left), FadeOut(true_label_right),
            FadeOut(left_title), FadeOut(left_subtitle),
            FadeOut(right_title), FadeOut(right_subtitle),
            FadeOut(title)
        )

        # Conclusion slide
        conclusion_title = Text("The Key Insight", font_size=44, color=YELLOW)
        conclusion_title.to_edge(UP, buff=1)
        self.play(Write(conclusion_title))

        # Two-line conclusion
        line1 = Text("Sample SIZE reduces variability.", font_size=32)
        line1.set_color(BLUE)

        line2 = Text("Sample METHOD reduces bias.", font_size=32)
        line2.set_color(GREEN)

        conclusion_group = VGroup(line1, line2).arrange(DOWN, buff=0.5)
        conclusion_group.move_to(ORIGIN)

        self.play(Write(line1))
        self.wait(0.5)
        self.play(Write(line2))
        self.wait(0.5)

        # Box around the key message
        box = SurroundingRectangle(conclusion_group, color=WHITE, buff=0.3)
        self.play(Create(box))

        # Final emphasis
        warning = Text(
            "A biased sample stays biased, no matter how large!",
            font_size=26,
            color=RED
        )
        warning.next_to(box, DOWN, buff=0.5)
        self.play(Write(warning))

        self.wait(2)


class BiasVsVariability(Scene):
    """
    Additional scene showing the difference between bias and variability
    using a target analogy.

    Run with: manim -qm --format=mp4 large_vs_representative.py BiasVsVariability
    """
    def construct(self):
        # Colors
        BIASED_COLOR = RED
        RANDOM_COLOR = GREEN

        title = Text("Bias vs Variability: The Target Analogy", font_size=40)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))

        # Create 4 targets in a 2x2 grid
        target_radius = 0.8
        ring_count = 3

        def create_target(center):
            target = VGroup()
            for i in range(ring_count, 0, -1):
                ring = Circle(
                    radius=target_radius * i / ring_count,
                    stroke_color=WHITE,
                    stroke_width=2,
                    fill_color=WHITE if i == 1 else BLACK,
                    fill_opacity=0.1 if i > 1 else 1
                )
                ring.move_to(center)
                target.add(ring)
            # Bullseye
            bullseye = Dot(center, radius=0.08, color=YELLOW)
            target.add(bullseye)
            return target

        # Positions for 4 targets
        positions = [
            LEFT * 3 + UP * 0.5,     # Top-left: High bias, high variability
            RIGHT * 3 + UP * 0.5,    # Top-right: Low bias, high variability
            LEFT * 3 + DOWN * 2,     # Bottom-left: High bias, low variability
            RIGHT * 3 + DOWN * 2,    # Bottom-right: Low bias, low variability
        ]

        targets = VGroup(*[create_target(pos) for pos in positions])
        self.play(*[Create(t) for t in targets])

        # Labels for each target
        labels = [
            ("High Bias\nHigh Variability", BIASED_COLOR),
            ("Low Bias\nHigh Variability", ORANGE),
            ("High Bias\nLow Variability", BIASED_COLOR),
            ("Low Bias\nLow Variability", RANDOM_COLOR),
        ]

        label_texts = VGroup()
        for i, (label_text, color) in enumerate(labels):
            text = Text(label_text, font_size=16, color=color)
            text.next_to(targets[i], UP, buff=0.2)
            label_texts.add(text)

        self.play(*[Write(t) for t in label_texts])

        # Add dots to each target
        random.seed(123)
        np.random.seed(123)

        def add_shots(target_center, bias_x, bias_y, spread, color, n=8):
            dots = VGroup()
            for _ in range(n):
                x = target_center[0] + bias_x + random.gauss(0, spread)
                y = target_center[1] + bias_y + random.gauss(0, spread)
                dot = Dot([x, y, 0], radius=0.06, color=color)
                dots.add(dot)
            return dots

        # Top-left: High bias, high variability (scattered, off-center)
        dots1 = add_shots(positions[0], 0.4, 0.3, 0.25, BIASED_COLOR)

        # Top-right: Low bias, high variability (scattered, centered)
        dots2 = add_shots(positions[1], 0, 0, 0.3, ORANGE)

        # Bottom-left: High bias, low variability (tight cluster, off-center)
        dots3 = add_shots(positions[2], 0.4, -0.3, 0.08, BIASED_COLOR)

        # Bottom-right: Low bias, low variability (tight cluster, centered)
        dots4 = add_shots(positions[3], 0, 0, 0.08, RANDOM_COLOR)

        all_dots = VGroup(dots1, dots2, dots3, dots4)
        self.play(*[FadeIn(d) for d in all_dots])
        self.wait(1)

        # Highlight the key insight
        insight_box = Rectangle(
            width=3.5, height=1.5,
            stroke_color=RANDOM_COLOR, stroke_width=3
        )
        insight_box.move_to(positions[3])
        self.play(Create(insight_box))

        goal_text = Text("GOAL: Low bias AND low variability", font_size=20, color=RANDOM_COLOR)
        goal_text.next_to(insight_box, DOWN, buff=0.3)
        self.play(Write(goal_text))

        self.wait(1)

        # Show what increasing sample size does
        explanation = VGroup(
            Text("Increasing sample size:", font_size=22),
            Text("- Reduces VARIABILITY (tighter cluster)", font_size=18, color=BLUE),
            Text("- Does NOT reduce BIAS (still off-center)", font_size=18, color=RED),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        explanation.to_edge(DOWN, buff=0.3)

        self.play(Write(explanation))
        self.wait(2)

        # Final message
        self.play(FadeOut(explanation))

        final = Text(
            "Only proper sampling method can eliminate bias!",
            font_size=28,
            color=YELLOW
        )
        final.to_edge(DOWN, buff=0.5)
        self.play(Write(final))

        self.wait(2)
