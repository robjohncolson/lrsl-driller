"""
Randomization Distribution Process (AP Stats Unit 5, Topic 5.3c)

Visualizes how a randomization distribution is created for a two-group
experiment. Shows two treatment groups with data values, animates
shuffling/randomly reassigning values to groups, calculates the difference
in means for each shuffle, and builds up a dot plot of differences. The key
insight: this simulates what differences look like under chance alone.

Run with: manim -qm --format=mp4 apstat_53_randomization_process.py RandomizationProcess
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class RandomizationProcess(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(7)

        # ========== TITLE ==========
        title = Text("Building a Randomization Distribution", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== PART 1: Show the Experiment ==========
        context = Text(
            "Experiment: Does a new fertilizer increase plant growth?",
            font_size=24, color=TEAL_3B1B,
        )
        context.next_to(title, DOWN, buff=0.25)
        self.play(Write(context))
        self.wait(0.3)

        # Treatment group data
        treatment_vals = [12.3, 14.1, 11.8, 15.2, 13.7, 14.5, 12.9, 13.8]
        control_vals = [10.1, 11.5, 9.8, 12.0, 10.9, 11.2, 10.4, 11.8]
        all_vals = treatment_vals + control_vals
        n_treat = len(treatment_vals)
        n_control = len(control_vals)

        treat_mean = np.mean(treatment_vals)
        control_mean = np.mean(control_vals)
        observed_diff = treat_mean - control_mean

        # Treatment group display
        treat_header = Text("Treatment (fertilizer)", font_size=22, color=GREEN_3B1B)
        treat_header.shift(LEFT * 3.5 + UP * 0.8)

        treat_dots = VGroup()
        treat_labels = VGroup()
        for i, val in enumerate(treatment_vals):
            row = i // 4
            col = i % 4
            dot = Dot(
                point=treat_header.get_center() + DOWN * (0.6 + row * 0.55) + RIGHT * (col * 1.1 - 1.6),
                radius=0.12,
                color=GREEN_3B1B,
                fill_opacity=0.8,
            )
            lab = Text(f"{val}", font_size=14, color=WHITE)
            lab.next_to(dot, DOWN, buff=0.05)
            treat_dots.add(dot)
            treat_labels.add(lab)

        # Control group display
        ctrl_header = Text("Control (no fertilizer)", font_size=22, color=BLUE_3B1B)
        ctrl_header.shift(RIGHT * 3.5 + UP * 0.8)

        ctrl_dots = VGroup()
        ctrl_labels = VGroup()
        for i, val in enumerate(control_vals):
            row = i // 4
            col = i % 4
            dot = Dot(
                point=ctrl_header.get_center() + DOWN * (0.6 + row * 0.55) + RIGHT * (col * 1.1 - 1.6),
                radius=0.12,
                color=BLUE_3B1B,
                fill_opacity=0.8,
            )
            lab = Text(f"{val}", font_size=14, color=WHITE)
            lab.next_to(dot, DOWN, buff=0.05)
            ctrl_dots.add(dot)
            ctrl_labels.add(lab)

        self.play(
            Write(treat_header), Write(ctrl_header),
            LaggedStart(*[FadeIn(d, scale=0.5) for d in treat_dots], lag_ratio=0.05),
            LaggedStart(*[FadeIn(d, scale=0.5) for d in ctrl_dots], lag_ratio=0.05),
            run_time=0.8,
        )
        self.play(
            LaggedStart(*[Write(l) for l in treat_labels], lag_ratio=0.03),
            LaggedStart(*[Write(l) for l in ctrl_labels], lag_ratio=0.03),
            run_time=0.6,
        )
        self.wait(0.3)

        # Show observed difference
        diff_text = Text(
            f"Observed difference: x-bar(T) - x-bar(C) = {observed_diff:.2f} cm",
            font_size=24, color=RED,
        )
        diff_text.shift(DOWN * 1.2)
        self.play(Write(diff_text))
        self.wait(0.5)

        question = Text(
            "Could this difference happen by chance alone?",
            font_size=22, color=YELLOW_3B1B,
        )
        question.next_to(diff_text, DOWN, buff=0.2)
        self.play(Write(question))
        self.wait(0.5)

        # ========== PART 2: Show One Shuffle ==========
        self.play(
            FadeOut(diff_text), FadeOut(question), FadeOut(context),
            run_time=0.4,
        )

        shuffle_title = Text(
            "Step 1: Shuffle ALL values into two new random groups",
            font_size=22, color=YELLOW_3B1B,
        )
        shuffle_title.next_to(title, DOWN, buff=0.2)
        self.play(Write(shuffle_title))
        self.wait(0.3)

        # Animate dots moving to center, mixing, then re-distributing
        all_dots = VGroup(*treat_dots, *ctrl_dots)
        all_labels_group = VGroup(*treat_labels, *ctrl_labels)

        # Move all to center
        center_positions = []
        for i in range(len(all_vals)):
            row = i // 8
            col = i % 8
            pos = LEFT * 2.8 + RIGHT * col * 0.8 + DOWN * (0.3 + row * 0.6)
            center_positions.append(pos)

        self.play(FadeOut(all_labels_group), run_time=0.3)

        # All dots turn white (mixed pool)
        mix_anims = []
        for i, dot in enumerate(all_dots):
            mix_anims.append(dot.animate.move_to(center_positions[i]).set_color(WHITE))

        self.play(*mix_anims, run_time=0.8)
        self.wait(0.3)

        mix_label = Text("All 16 values in one pool", font_size=20, color=GRAY)
        mix_label.next_to(all_dots, DOWN, buff=0.2)
        self.play(Write(mix_label))
        self.wait(0.3)

        # Randomly assign to two groups
        shuffled_indices = np.random.permutation(len(all_vals))
        new_group1_idx = shuffled_indices[:n_treat]
        new_group2_idx = shuffled_indices[n_treat:]

        shuffle_anims = []
        for i, idx in enumerate(new_group1_idx):
            row = i // 4
            col = i % 4
            target = treat_header.get_center() + DOWN * (0.6 + row * 0.55) + RIGHT * (col * 1.1 - 1.6)
            shuffle_anims.append(
                all_dots[idx].animate.move_to(target).set_color(GREEN_3B1B)
            )

        for i, idx in enumerate(new_group2_idx):
            row = i // 4
            col = i % 4
            target = ctrl_header.get_center() + DOWN * (0.6 + row * 0.55) + RIGHT * (col * 1.1 - 1.6)
            shuffle_anims.append(
                all_dots[idx].animate.move_to(target).set_color(BLUE_3B1B)
            )

        self.play(FadeOut(mix_label), run_time=0.2)
        self.play(*shuffle_anims, run_time=1)
        self.wait(0.3)

        # Calculate shuffled difference
        group1_vals = [all_vals[i] for i in new_group1_idx]
        group2_vals = [all_vals[i] for i in new_group2_idx]
        shuffle_diff = np.mean(group1_vals) - np.mean(group2_vals)

        step2 = Text(
            f"Step 2: Compute difference = {shuffle_diff:.2f}",
            font_size=22, color=TEAL_3B1B,
        )
        step2.next_to(shuffle_title, DOWN, buff=0.15)
        self.play(Write(step2))
        self.wait(0.4)

        step3 = Text("Step 3: Repeat this MANY times!", font_size=22, color=RED)
        step3.next_to(step2, DOWN, buff=0.15)
        self.play(Write(step3))
        self.wait(0.5)

        # ========== PART 3: Build the Randomization Distribution ==========
        self.play(
            FadeOut(all_dots), FadeOut(treat_header), FadeOut(ctrl_header),
            FadeOut(shuffle_title), FadeOut(step2), FadeOut(step3),
            run_time=0.5,
        )

        dist_title = Text(
            "Randomization Distribution (1000 shuffles)",
            font_size=26, color=TEAL_3B1B,
        )
        dist_title.next_to(title, DOWN, buff=0.3)
        self.play(Write(dist_title))

        # Pre-compute 1000 shuffled differences
        n_shuffles = 1000
        diffs = []
        for _ in range(n_shuffles):
            perm = np.random.permutation(all_vals)
            g1 = perm[:n_treat]
            g2 = perm[n_treat:]
            diffs.append(np.mean(g1) - np.mean(g2))
        diffs = np.array(diffs)

        # Axes for the distribution
        x_min, x_max = -4.0, 4.0
        axes = Axes(
            x_range=[x_min, x_max, 0.5],
            y_range=[0, 180, 30],
            x_length=10,
            y_length=3.5,
            axis_config={"include_tip": False, "include_numbers": True},
            x_axis_config={
                "numbers_to_include": np.arange(-4, 4.5, 1),
                "font_size": 16,
            },
            y_axis_config={
                "numbers_to_include": [0, 60, 120, 180],
                "font_size": 16,
            },
        )
        axes.shift(DOWN * 0.8)

        x_label = Text("Difference in means (shuffled)", font_size=18)
        x_label.next_to(axes.x_axis, DOWN, buff=0.3)

        self.play(Create(axes), Write(x_label), run_time=0.6)

        # Build histogram
        bin_width = 0.25
        bins = np.arange(x_min, x_max + bin_width, bin_width)
        counts, _ = np.histogram(diffs, bins=bins)
        num_bins = len(counts)

        bars = VGroup()
        for i, count in enumerate(counts):
            if count == 0:
                continue
            left_edge = x_min + i * bin_width
            center_x = left_edge + bin_width / 2
            bar = Rectangle(
                width=axes.x_length * bin_width / (x_max - x_min) * 0.9,
                height=max(count * (axes.y_length / 180), 0.01),
                fill_color=TEAL_3B1B,
                fill_opacity=0.65,
                stroke_color=WHITE,
                stroke_width=0.5,
            )
            bar.move_to(axes.c2p(center_x, count / 2))
            bars.add(bar)

        self.play(
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in bars],
                lag_ratio=0.02,
            ),
            run_time=1.5,
        )
        self.wait(0.3)

        # Mark zero (expected under H0)
        zero_line = DashedLine(
            axes.c2p(0, 0), axes.c2p(0, 170),
            color=WHITE, stroke_width=2,
        )
        zero_label = Text("0", font_size=18, color=WHITE)
        zero_label.next_to(zero_line, UP, buff=0.05)
        self.play(Create(zero_line), Write(zero_label), run_time=0.4)

        # Centered at zero explanation
        centered_note = Text(
            "Centered at 0 (no real difference)",
            font_size=18, color=GRAY,
        )
        centered_note.next_to(zero_label, RIGHT, buff=0.3)
        self.play(Write(centered_note))
        self.wait(0.5)

        # Mark the observed difference
        obs_line = DashedLine(
            axes.c2p(observed_diff, 0),
            axes.c2p(observed_diff, 160),
            color=RED, stroke_width=3,
        )
        obs_label = Text(
            f"Observed = {observed_diff:.2f}",
            font_size=20, color=RED, weight=BOLD,
        )
        obs_label.next_to(obs_line, UP, buff=0.05)
        self.play(Create(obs_line), Write(obs_label), run_time=0.5)
        self.wait(0.5)

        # ========== PART 4: Key Insight ==========
        self.play(FadeOut(centered_note), run_time=0.3)

        insight_content = VGroup(
            Text("Key Insight", font_size=28, color=YELLOW_3B1B, weight=BOLD),
            Text(
                "This distribution shows what differences",
                font_size=24,
            ),
            Text(
                "look like under CHANCE ALONE",
                font_size=24, color=RED,
            ),
            Text(
                "(assuming no real treatment effect)",
                font_size=20, color=GRAY,
            ),
        ).arrange(DOWN, buff=0.12)
        insight_content.to_edge(DOWN, buff=0.25)

        box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
            fill_color="#1C1C1C", fill_opacity=0.9,
        )

        self.play(FadeIn(box), Write(insight_content), run_time=1)
        self.wait(2)
