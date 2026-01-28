"""
Manim animation for AP Stats Lesson 8: Simulation Step 2 - Define Trial

Concept:
- Step 2 of simulation: Define what ONE trial consists of
- One trial = simulating the ENTIRE scenario once
- Ask: What random numbers do I generate? What do I count/record? When is trial over?

Animation shows:
1. Title: "Simulation Step 2: Define One Trial"
2. Scenario: "Flip coin until you get heads"
3. Show one trial: Generate random numbers until success
4. Show what to record: "Number of flips needed"
5. Show multiple trials with different results
6. Key insight: "One trial = complete scenario once"

Render command:
    manim -qm --format=mp4 l08_trial_definition.py TrialDefinition
"""

from manim import *
import random

class TrialDefinition(Scene):
    def construct(self):
        # Title
        title = Text("Simulation Step 2: Define One Trial", font_size=40, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Scenario
        scenario = Text("Scenario: Flip coin until you get heads", font_size=32, color=YELLOW)
        scenario.next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(scenario))
        self.wait(1)

        # Step 2 box
        step_box = VGroup(
            Text("Step 2: What is ONE trial?", font_size=28, weight=BOLD, color=BLUE),
            Text("• Generate random numbers until...", font_size=24),
            Text("• Record the result", font_size=24),
            Text("• Trial ends when scenario completes", font_size=24)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        step_box.next_to(scenario, DOWN, buff=0.6)

        self.play(FadeIn(step_box[0]))
        self.wait(0.5)
        self.play(FadeIn(step_box[1:]))
        self.wait(1.5)

        # Move everything up to make room
        self.play(
            VGroup(title, scenario, step_box).animate.scale(0.7).to_edge(UP, buff=0.2),
            run_time=0.5
        )

        # Show one trial execution
        trial_title = Text("Trial 1:", font_size=28, weight=BOLD, color=BLUE)
        trial_title.move_to(UP * 0.5 + LEFT * 4)
        self.play(Write(trial_title))

        # Flip sequence
        flips = VGroup()
        flip_results = ["T", "T", "H"]  # Predetermined for consistency
        x_pos = -2

        for i, result in enumerate(flip_results):
            # Coin flip animation
            coin = Circle(radius=0.3, color=WHITE, fill_opacity=0.2)
            coin.move_to(UP * 0.5 + RIGHT * x_pos)

            label = Text(result, font_size=24, weight=BOLD)
            label.move_to(coin.get_center())

            if result == "H":
                label.set_color(GREEN)
                coin.set_color(GREEN)
            else:
                label.set_color(RED)

            flip_group = VGroup(coin, label)
            flips.add(flip_group)

            self.play(FadeIn(flip_group), run_time=0.3)
            self.wait(0.2)

            x_pos += 0.8

        # Highlight the success
        success_box = SurroundingRectangle(flips[-1], color=GREEN, buff=0.1)
        self.play(Create(success_box))
        self.wait(0.3)

        # Record result
        record = Text("Record: 3 flips", font_size=26, color=GREEN, weight=BOLD)
        record.next_to(flips, DOWN, buff=0.5)
        self.play(Write(record))
        self.wait(1)

        # Clear for multiple trials
        self.play(
            FadeOut(VGroup(trial_title, flips, success_box, record)),
            run_time=0.5
        )

        # Show multiple trials
        trials_title = Text("Multiple Trials:", font_size=28, weight=BOLD, color=BLUE)
        trials_title.move_to(UP * 1 + LEFT * 4)
        self.play(Write(trials_title))

        # Table of trials
        trial_data = [
            ("Trial 1:", "T, T, H", "3"),
            ("Trial 2:", "H", "1"),
            ("Trial 3:", "T, T, T, T, H", "5"),
            ("Trial 4:", "T, H", "2")
        ]

        trial_rows = VGroup()
        y_pos = 0.3

        for trial_num, flips_text, count in trial_data:
            trial_label = Text(trial_num, font_size=22, weight=BOLD)
            trial_label.move_to(LEFT * 5 + UP * y_pos)

            flips_label = Text(flips_text, font_size=22)
            flips_label.next_to(trial_label, RIGHT, buff=0.3)

            arrow = Text("→", font_size=22, color=GREEN)
            arrow.next_to(flips_label, RIGHT, buff=0.3)

            count_label = Text(count + " flips", font_size=22, color=GREEN, weight=BOLD)
            count_label.next_to(arrow, RIGHT, buff=0.3)

            row = VGroup(trial_label, flips_label, arrow, count_label)
            trial_rows.add(row)

            self.play(FadeIn(row), run_time=0.4)
            self.wait(0.2)

            y_pos -= 0.6

        self.wait(1)

        # Key insight box
        insight_box = VGroup(
            RoundedRectangle(
                width=10, height=2, corner_radius=0.2,
                color=BLUE, fill_opacity=0.1
            ),
            Text("One Trial = Complete Scenario Once",
                 font_size=30, weight=BOLD, color=BLUE),
            Text("Each trial may have different random outcomes",
                 font_size=24, color=WHITE)
        )
        insight_box[1].move_to(DOWN * 2)
        insight_box[2].next_to(insight_box[1], DOWN, buff=0.2)
        insight_box[0].move_to(insight_box[1:].get_center())
        insight_box.move_to(DOWN * 2.2)

        self.play(FadeIn(insight_box))
        self.wait(2)

        # Fade out
        self.play(
            FadeOut(Group(*self.mobjects)),
            run_time=0.5
        )
        self.wait(0.5)
