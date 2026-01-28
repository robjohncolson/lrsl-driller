"""
Gambler's Fallacy / Independence Animation

Shows why past coin flips don't affect future probabilities.

Run with:
manim -qm --format=mp4 l03_gamblers_fallacy.py GamblersFallacy
"""

from manim import *

class GamblersFallacy(Scene):
    def construct(self):
        # Title
        title = Text("The Gambler's Fallacy", font_size=48, weight=BOLD)
        self.play(Write(title))
        self.wait(1)
        self.play(title.animate.scale(0.6).to_edge(UP))
        self.wait(0.5)

        # Show sequence of coin flips
        coins = VGroup()
        for i in range(5):
            coin = Circle(radius=0.4, color=BLUE, fill_opacity=0.2)
            label = Text("T", font_size=32, color=WHITE)
            label.move_to(coin.get_center())
            coin_group = VGroup(coin, label)
            coin_group.shift(LEFT * 4 + RIGHT * i * 1.5)
            coins.add(coin_group)

        # Animate coins appearing one by one
        for i, coin in enumerate(coins):
            self.play(FadeIn(coin), run_time=0.3)
        self.wait(1)

        # Move coins up
        self.play(coins.animate.shift(UP * 1.5))
        self.wait(0.5)

        # Show wrong thinking
        wrong_thought = VGroup(
            Text("\"Heads must be due!\"", font_size=32, color=RED),
            Text("✗", font_size=48, color=RED, weight=BOLD)
        ).arrange(RIGHT, buff=0.5)
        wrong_thought.shift(DOWN * 0.5)

        self.play(Write(wrong_thought[0]))
        self.wait(0.5)
        self.play(FadeIn(wrong_thought[1], scale=1.5))
        self.wait(1)

        # Fade out wrong thinking
        self.play(FadeOut(wrong_thought))
        self.wait(0.3)

        # Show correct thinking
        correct_thought = VGroup(
            Text("\"Still 50/50!\"", font_size=32, color=GREEN),
            Text("✓", font_size=48, color=GREEN, weight=BOLD)
        ).arrange(RIGHT, buff=0.5)
        correct_thought.shift(DOWN * 0.5)

        self.play(Write(correct_thought[0]))
        self.wait(0.5)
        self.play(FadeIn(correct_thought[1], scale=1.5))
        self.wait(1)

        # Fade out correct thinking
        self.play(FadeOut(correct_thought))
        self.wait(0.3)

        # Show probability equation
        prob_eq = MathTex("P(H) = 0.5", font_size=48, color=YELLOW)
        prob_eq.shift(DOWN * 0.5)

        self.play(Write(prob_eq))
        self.wait(1)

        # Emphasize that probability stays constant
        emphasis_box = SurroundingRectangle(prob_eq, color=YELLOW, buff=0.2)
        self.play(Create(emphasis_box))
        self.play(Flash(prob_eq, color=YELLOW, line_length=0.3))
        self.wait(0.5)

        # Fade out probability
        self.play(FadeOut(prob_eq), FadeOut(emphasis_box))
        self.wait(0.3)

        # Key insight
        insight = Text(
            "Past results don't affect\nfuture probabilities",
            font_size=36,
            color=WHITE,
            line_spacing=1.2
        )
        insight.shift(DOWN * 0.5)

        self.play(Write(insight))
        self.wait(2)

        # Fade out everything
        self.play(
            FadeOut(title),
            FadeOut(coins),
            FadeOut(insight)
        )
        self.wait(0.5)
