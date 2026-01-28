"""
Topics 4.1-4.2 Capstone Review Animation

Render command:
manim -qm --format=mp4 l11_capstone_41_42.py Capstone41_42

This animation provides a fast-paced flashcard-style review of key probability concepts:
- Random Process
- Independence
- Streaks
- Simulation
- Law of Large Numbers
"""

from manim import *

class Capstone41_42(Scene):
    def construct(self):
        # Title screen
        title = Text("Topics 4.1-4.2 Review", font_size=48, weight=BOLD)
        subtitle = Text("Key Probability Concepts", font_size=32, color=GRAY)
        subtitle.next_to(title, DOWN, buff=0.5)

        self.play(Write(title), run_time=0.8)
        self.play(FadeIn(subtitle), run_time=0.5)
        self.wait(0.7)
        self.play(FadeOut(title), FadeOut(subtitle), run_time=0.5)

        # Concept 1: Random Process
        self.show_random_process()

        # Concept 2: Independence
        self.show_independence()

        # Concept 3: Streaks
        self.show_streaks()

        # Concept 4: Simulation
        self.show_simulation()

        # Concept 5: Law of Large Numbers
        self.show_law_of_large_numbers()

        # Closing message
        self.show_closing()

    def show_random_process(self):
        """Concept 1: Random Process"""
        header = Text("1. Random Process", font_size=40, color=BLUE, weight=BOLD)
        header.to_edge(UP)

        definition = Text(
            "Known outcomes,\nunpredictable results",
            font_size=32,
            color=WHITE
        )

        # Visual: Dice showing different outcomes
        dice_values = [1, 3, 6, 2, 5]
        dice_group = VGroup()
        for i, val in enumerate(dice_values):
            square = Square(side_length=0.6, color=BLUE, fill_opacity=0.2)
            number = Text(str(val), font_size=28)
            number.move_to(square)
            die = VGroup(square, number)
            die.shift(LEFT * 2 + RIGHT * i)
            dice_group.add(die)

        dice_group.next_to(definition, DOWN, buff=0.8)

        self.play(FadeIn(header), run_time=0.4)
        self.play(Write(definition), run_time=0.6)
        self.play(LaggedStart(*[FadeIn(die) for die in dice_group], lag_ratio=0.15), run_time=1)
        self.wait(2.5)
        self.play(
            FadeOut(header), FadeOut(definition), FadeOut(dice_group),
            run_time=0.5
        )

    def show_independence(self):
        """Concept 2: Independence"""
        header = Text("2. Independence", font_size=40, color=GREEN, weight=BOLD)
        header.to_edge(UP)

        definition = Text(
            "Past doesn't affect future",
            font_size=32,
            color=WHITE
        )

        warning = Text(
            "Avoid Gambler's Fallacy!",
            font_size=28,
            color=RED,
            slant=ITALIC
        )
        warning.next_to(definition, DOWN, buff=0.5)

        # Visual: Coin flips
        coin_sequence = Text("H → H → H → ?", font_size=36, color=GREEN)
        coin_sequence.next_to(warning, DOWN, buff=0.7)

        probability = MathTex(r"P(H) = 0.5", font_size=36, color=GREEN)
        probability.next_to(coin_sequence, DOWN, buff=0.5)

        self.play(FadeIn(header), run_time=0.4)
        self.play(Write(definition), run_time=0.6)
        self.play(FadeIn(warning), run_time=0.5)
        self.play(Write(coin_sequence), run_time=0.5)
        self.play(Write(probability), run_time=0.5)
        self.wait(2)
        self.play(
            FadeOut(header), FadeOut(definition), FadeOut(warning),
            FadeOut(coin_sequence), FadeOut(probability),
            run_time=0.5
        )

    def show_streaks(self):
        """Concept 3: Streaks"""
        header = Text("3. Streaks Are Normal", font_size=40, color=YELLOW, weight=BOLD)
        header.to_edge(UP)

        definition = Text(
            "Random data has patterns",
            font_size=32,
            color=WHITE
        )

        subtitle = Text(
            "Humans try to avoid them!",
            font_size=26,
            color=YELLOW,
            slant=ITALIC
        )
        subtitle.next_to(definition, DOWN, buff=0.4)

        # Visual: Sequence with streak
        random_seq = Text("T H H H H T H T", font_size=32, color=YELLOW)
        random_seq.next_to(subtitle, DOWN, buff=0.7)

        # Highlight the streak
        streak_box = Rectangle(
            width=2.5, height=0.8,
            color=RED, stroke_width=3
        )
        streak_box.move_to(random_seq).shift(LEFT * 0.3)

        self.play(FadeIn(header), run_time=0.4)
        self.play(Write(definition), run_time=0.6)
        self.play(FadeIn(subtitle), run_time=0.5)
        self.play(Write(random_seq), run_time=0.6)
        self.play(Create(streak_box), run_time=0.5)
        self.wait(2)
        self.play(
            FadeOut(header), FadeOut(definition), FadeOut(subtitle),
            FadeOut(random_seq), FadeOut(streak_box),
            run_time=0.5
        )

    def show_simulation(self):
        """Concept 4: Simulation"""
        header = Text("4. Simulation", font_size=40, color=ORANGE, weight=BOLD)
        header.to_edge(UP)

        definition = Text(
            "Model random events\nwith many trials",
            font_size=32,
            color=WHITE
        )

        # Visual: Trial counter
        trials_label = Text("Trials:", font_size=28, color=ORANGE)
        trials_label.next_to(definition, DOWN, buff=0.8)

        # Animated counter
        counter = Integer(0, font_size=36, color=ORANGE)
        counter.next_to(trials_label, RIGHT, buff=0.3)

        self.play(FadeIn(header), run_time=0.4)
        self.play(Write(definition), run_time=0.6)
        self.play(FadeIn(trials_label), FadeIn(counter), run_time=0.4)

        # Animate counting
        self.play(
            counter.animate.set_value(1000),
            rate_func=linear,
            run_time=2
        )

        checkmark = Text("✓", font_size=48, color=GREEN)
        checkmark.next_to(counter, RIGHT, buff=0.5)
        self.play(FadeIn(checkmark, scale=1.5), run_time=0.4)

        self.wait(0.8)
        self.play(
            FadeOut(header), FadeOut(definition), FadeOut(trials_label),
            FadeOut(counter), FadeOut(checkmark),
            run_time=0.5
        )

    def show_law_of_large_numbers(self):
        """Concept 5: Law of Large Numbers"""
        header = Text("5. Law of Large Numbers", font_size=40, color=PURPLE, weight=BOLD)
        header.to_edge(UP)

        definition = Text(
            "More trials → closer to\ntrue probability",
            font_size=32,
            color=WHITE
        )

        # Visual: Formula
        formula = MathTex(
            r"\text{As } n \to \infty, \quad \bar{x} \to \mu",
            font_size=36,
            color=PURPLE
        )
        formula.next_to(definition, DOWN, buff=0.8)

        # Simple visualization
        convergence = Text("Estimate converges!", font_size=28, color=GREEN)
        convergence.next_to(formula, DOWN, buff=0.6)

        # Arrow showing convergence
        arrow = Arrow(
            start=LEFT * 2, end=RIGHT * 2,
            color=PURPLE,
            stroke_width=6
        )
        arrow.next_to(convergence, DOWN, buff=0.5)

        left_label = Text("Few trials", font_size=20, color=RED)
        left_label.next_to(arrow.get_start(), DOWN, buff=0.2)

        right_label = Text("Many trials", font_size=20, color=GREEN)
        right_label.next_to(arrow.get_end(), DOWN, buff=0.2)

        self.play(FadeIn(header), run_time=0.4)
        self.play(Write(definition), run_time=0.6)
        self.play(Write(formula), run_time=0.8)
        self.play(FadeIn(convergence), run_time=0.5)
        self.play(
            GrowArrow(arrow),
            FadeIn(left_label),
            FadeIn(right_label),
            run_time=0.8
        )
        self.wait(2)
        self.play(
            FadeOut(header), FadeOut(definition), FadeOut(formula),
            FadeOut(convergence), FadeOut(arrow),
            FadeOut(left_label), FadeOut(right_label),
            run_time=0.5
        )

    def show_closing(self):
        """Closing message"""
        message = Text(
            "You've mastered the\nfoundations of probability!",
            font_size=40,
            color=GOLD,
            weight=BOLD
        )

        stars = VGroup(*[
            Star(color=YELLOW, fill_opacity=1).scale(0.4)
            for _ in range(5)
        ])
        stars.arrange(RIGHT, buff=0.3)
        stars.next_to(message, DOWN, buff=0.8)

        self.play(Write(message), run_time=1)
        self.play(
            LaggedStart(*[FadeIn(star, scale=1.5) for star in stars], lag_ratio=0.2),
            run_time=1.2
        )
        self.wait(2)
        self.play(FadeOut(message), FadeOut(stars), run_time=0.8)
