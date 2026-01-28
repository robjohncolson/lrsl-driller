"""
Manim animation for Full Simulation Design (4-step process).

Render with:
manim -qm --format=mp4 l10_full_simulation.py FullSimulationDesign
"""

from manim import *
import random

class FullSimulationDesign(Scene):
    def construct(self):
        # Title
        title = Text("Complete Simulation Design", font_size=48, weight=BOLD)
        self.play(Write(title))
        self.wait(1)
        self.play(FadeOut(title))

        # Example scenario
        scenario = VGroup(
            Text("Example Scenario:", font_size=36, weight=BOLD),
            Text("Estimate P(3+ heads in 5 coin flips)", font_size=32, color=YELLOW)
        ).arrange(DOWN, buff=0.3)
        self.play(Write(scenario))
        self.wait(2)
        self.play(scenario.animate.scale(0.6).to_edge(UP))

        # Step 1: Assign digits
        step1_title = Text("Step 1: Assign Digits to Outcomes", font_size=32, color=BLUE, weight=BOLD)
        step1_title.next_to(scenario, DOWN, buff=0.5)
        self.play(Write(step1_title))

        step1_content = VGroup(
            Text("Match the probability of each outcome:", font_size=24),
            Text("• 1-50 = Heads (H)", font_size=28, color=GREEN),
            Text("• 51-100 = Tails (T)", font_size=28, color=RED)
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        step1_content.next_to(step1_title, DOWN, buff=0.3)
        self.play(FadeIn(step1_content, shift=DOWN))
        self.wait(2)

        # Clear for step 2
        self.play(FadeOut(step1_title), FadeOut(step1_content))

        # Step 2: Define one trial
        step2_title = Text("Step 2: Define ONE Trial", font_size=32, color=GREEN, weight=BOLD)
        step2_title.next_to(scenario, DOWN, buff=0.5)
        self.play(Write(step2_title))

        step2_content = VGroup(
            Text("Generate: 5 random numbers (1-100)", font_size=26),
            Text("Record: Count if ≥ 3 are heads (1-50)", font_size=26)
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        step2_content.next_to(step2_title, DOWN, buff=0.3)
        self.play(FadeIn(step2_content, shift=DOWN))

        # Show example trial
        example_trial = VGroup(
            Text("Example:", font_size=24, weight=BOLD),
            Text("Random: 23, 67, 45, 12, 88", font_size=24, color=YELLOW),
            Text("Heads: 23(H), 45(H), 12(H) → 3 heads ✓", font_size=24, color=GREEN)
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        example_trial.next_to(step2_content, DOWN, buff=0.3)
        self.play(FadeIn(example_trial, shift=DOWN))
        self.wait(2.5)

        # Clear for step 3
        self.play(FadeOut(step2_title), FadeOut(step2_content), FadeOut(example_trial))

        # Step 3: Perform MANY trials
        step3_title = Text("Step 3: Perform MANY Trials", font_size=32, color=YELLOW, weight=BOLD)
        step3_title.next_to(scenario, DOWN, buff=0.5)
        self.play(Write(step3_title))

        step3_content = Text("Run the trial repeatedly (at least 100 times)", font_size=26)
        step3_content.next_to(step3_title, DOWN, buff=0.3)
        self.play(FadeIn(step3_content, shift=DOWN))

        # Counter animation
        counter_label = Text("Trials completed:", font_size=24)
        counter_label.next_to(step3_content, DOWN, buff=0.4)
        counter = Integer(0, font_size=48, color=YELLOW)
        counter.next_to(counter_label, RIGHT, buff=0.3)

        success_label = Text("Successes (3+ heads):", font_size=24)
        success_label.next_to(counter_label, DOWN, buff=0.3)
        success_counter = Integer(0, font_size=48, color=GREEN)
        success_counter.next_to(success_label, RIGHT, buff=0.3)

        self.play(Write(counter_label), Write(counter), Write(success_label), Write(success_counter))

        # Simulate trials quickly
        random.seed(42)
        total_trials = 100
        successes = 0

        for i in range(1, total_trials + 1):
            # Simulate 5 coin flips
            flips = [random.randint(1, 100) for _ in range(5)]
            heads_count = sum(1 for x in flips if x <= 50)
            if heads_count >= 3:
                successes += 1

            # Update every 10 trials for speed
            if i % 10 == 0 or i == total_trials:
                self.play(
                    counter.animate.set_value(i),
                    success_counter.animate.set_value(successes),
                    run_time=0.2
                )

        self.wait(1.5)

        # Clear for step 4
        self.play(
            FadeOut(step3_title),
            FadeOut(step3_content),
            FadeOut(counter_label),
            FadeOut(counter),
            FadeOut(success_label),
            FadeOut(success_counter)
        )

        # Step 4: Calculate relative frequency
        step4_title = Text("Step 4: Calculate Relative Frequency", font_size=32, color=RED, weight=BOLD)
        step4_title.next_to(scenario, DOWN, buff=0.5)
        self.play(Write(step4_title))

        # Use actual values from simulation
        calculation = MathTex(
            r"\text{Estimated } P(\text{3+ heads}) = \frac{\text{successes}}{\text{total trials}} = \frac{" + str(successes) + r"}{100}",
            font_size=32
        )
        calculation.next_to(step4_title, DOWN, buff=0.4)
        self.play(Write(calculation))

        result_value = successes / 100
        result = MathTex(
            r"\approx " + f"{result_value:.2f}",
            font_size=40,
            color=YELLOW
        )
        result.next_to(calculation, DOWN, buff=0.3)
        self.play(Write(result))
        self.wait(2)

        # Clear for summary
        self.play(
            FadeOut(scenario),
            FadeOut(step4_title),
            FadeOut(calculation),
            FadeOut(result)
        )

        # Final summary box
        summary_title = Text("The 4-Step Simulation Process", font_size=36, weight=BOLD)
        summary_title.to_edge(UP)
        self.play(Write(summary_title))

        summary_steps = VGroup(
            Text("1. Assign digits to outcomes", font_size=26, color=BLUE),
            Text("   (match the probabilities)", font_size=22, color=BLUE),
            Text("2. Define ONE trial", font_size=26, color=GREEN),
            Text("   (what to generate, what to record)", font_size=22, color=GREEN),
            Text("3. Perform MANY trials", font_size=26, color=YELLOW),
            Text("   (at least 100)", font_size=22, color=YELLOW),
            Text("4. Calculate relative frequency", font_size=26, color=RED),
            Text("   (successes / total trials)", font_size=22, color=RED)
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        summary_steps.next_to(summary_title, DOWN, buff=0.5)

        # Create box around summary
        box = SurroundingRectangle(summary_steps, color=WHITE, buff=0.3, corner_radius=0.1)

        self.play(FadeIn(summary_steps, shift=UP))
        self.play(Create(box))
        self.wait(3)

        # Fade out
        self.play(FadeOut(summary_title), FadeOut(summary_steps), FadeOut(box))
        self.wait(0.5)
