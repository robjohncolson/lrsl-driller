"""
Sample Space Animation - Introduction to the set of all possible outcomes.

Render command:
    manim -qm --format=mp4 l12_sample_space.py SampleSpaceIntro

This animation demonstrates:
- Definition of sample space (S)
- Simple example: coin flip
- Complex example: die roll
- Compound example: two coins
- Importance of listing ALL outcomes
"""

from manim import *


class SampleSpaceIntro(Scene):
    def construct(self):
        # Title
        title = Text("Sample Space: All Possible Outcomes", font_size=44, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Definition
        definition = Text(
            "S = set of ALL possible non-overlapping outcomes",
            font_size=28,
            color=YELLOW
        )
        definition.next_to(title, DOWN, buff=0.4)
        self.play(FadeIn(definition))
        self.wait(1)

        # Clear for examples
        self.play(FadeOut(definition))

        # Example 1: Coin
        coin_label = Text("Coin Flip:", font_size=32, weight=BOLD)
        coin_label.move_to(UP * 2)

        # Simple coin representation
        coin = Circle(radius=0.4, color=BLUE, fill_opacity=0.3)
        coin_h = VGroup(coin.copy(), Text("H", font_size=32).move_to(coin))
        coin_t = VGroup(coin.copy(), Text("T", font_size=32).move_to(coin))

        coin_h.next_to(coin_label, DOWN, buff=0.5).shift(LEFT * 1.5)
        coin_t.next_to(coin_label, DOWN, buff=0.5).shift(RIGHT * 1.5)

        sample_space_1 = MathTex(r"S = \{H, T\}", font_size=40)
        sample_space_1.next_to(coin_h, DOWN, buff=0.8).shift(RIGHT * 1.5)

        self.play(Write(coin_label))
        self.play(FadeIn(coin_h), FadeIn(coin_t))
        self.play(Write(sample_space_1))
        self.wait(1.5)

        # Clear coin example
        self.play(
            FadeOut(coin_label),
            FadeOut(coin_h),
            FadeOut(coin_t),
            FadeOut(sample_space_1)
        )

        # Example 2: Die
        die_label = Text("Die Roll:", font_size=32, weight=BOLD)
        die_label.move_to(UP * 2.2)

        # Die representation
        die = Square(side_length=0.6, color=RED, fill_opacity=0.3)
        die_group = VGroup()
        for i in range(1, 7):
            d = VGroup(
                die.copy(),
                Text(str(i), font_size=24).move_to(die)
            )
            die_group.add(d)

        die_group.arrange(RIGHT, buff=0.3)
        die_group.next_to(die_label, DOWN, buff=0.5)
        die_group.scale(0.8)

        sample_space_2 = MathTex(r"S = \{1, 2, 3, 4, 5, 6\}", font_size=36)
        sample_space_2.next_to(die_group, DOWN, buff=0.6)

        self.play(Write(die_label))
        self.play(LaggedStart(*[FadeIn(d) for d in die_group], lag_ratio=0.15))
        self.play(Write(sample_space_2))
        self.wait(1.5)

        # Clear die example
        self.play(
            FadeOut(die_label),
            FadeOut(die_group),
            FadeOut(sample_space_2)
        )

        # Example 3: Two Coins (Grid)
        two_coins_label = Text("Two Coins:", font_size=32, weight=BOLD)
        two_coins_label.move_to(UP * 2.5)

        # Create grid representation
        outcomes = ["HH", "HT", "TH", "TT"]
        grid = VGroup()

        for i, outcome in enumerate(outcomes):
            # Small coin circles
            c1 = Circle(radius=0.25, color=BLUE, fill_opacity=0.2)
            t1 = Text(outcome[0], font_size=20).move_to(c1)
            c2 = Circle(radius=0.25, color=BLUE, fill_opacity=0.2)
            t2 = Text(outcome[1], font_size=20).move_to(c2)

            pair = VGroup(VGroup(c1, t1), VGroup(c2, t2))
            pair.arrange(RIGHT, buff=0.15)

            box = RoundedRectangle(
                width=1.2,
                height=0.7,
                corner_radius=0.1,
                color=GREEN,
                fill_opacity=0.1
            )
            outcome_group = VGroup(box, pair)
            grid.add(outcome_group)

        # Arrange in 2x2 grid
        grid.arrange_in_grid(rows=2, cols=2, buff=0.4)
        grid.next_to(two_coins_label, DOWN, buff=0.5)
        grid.scale(0.9)

        sample_space_3 = MathTex(r"S = \{HH, HT, TH, TT\}", font_size=36)
        sample_space_3.next_to(grid, DOWN, buff=0.6)

        self.play(Write(two_coins_label))
        self.play(LaggedStart(*[FadeIn(g) for g in grid], lag_ratio=0.2))
        self.play(Write(sample_space_3))
        self.wait(1)

        # Order matters note
        order_note = Text(
            "Order matters when sequence is recorded!",
            font_size=24,
            color=ORANGE,
            slant=ITALIC
        )
        order_note.next_to(sample_space_3, DOWN, buff=0.3)

        # Highlight HT vs TH
        ht_box = grid[1][0].copy().set_color(YELLOW)
        th_box = grid[2][0].copy().set_color(YELLOW)

        self.play(
            Write(order_note),
            Create(ht_box),
            Create(th_box)
        )
        self.wait(1.5)

        # Clear for final message
        self.play(
            FadeOut(two_coins_label),
            FadeOut(grid),
            FadeOut(sample_space_3),
            FadeOut(order_note),
            FadeOut(ht_box),
            FadeOut(th_box)
        )

        # Key insight
        key_insight = VGroup(
            Text("Key Insight:", font_size=36, weight=BOLD, color=YELLOW),
            Text("List EVERY possible outcome", font_size=32),
            Text("in the sample space S", font_size=32)
        )
        key_insight.arrange(DOWN, buff=0.3)
        key_insight.move_to(ORIGIN)

        # Add curly braces visual
        braces = MathTex(r"\{", r"\cdots", r"\}", font_size=80, color=BLUE)
        braces.arrange(RIGHT, buff=1.5)
        braces.next_to(key_insight, DOWN, buff=0.5)

        self.play(Write(key_insight[0]))
        self.play(FadeIn(key_insight[1]), FadeIn(key_insight[2]))
        self.play(Write(braces))
        self.wait(2)

        # Fade out
        self.play(
            FadeOut(title),
            FadeOut(key_insight),
            FadeOut(braces)
        )
