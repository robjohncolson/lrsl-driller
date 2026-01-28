"""
Random Process Definition (l01)

A random process has:
- All possible outcomes are KNOWN
- Individual outcomes are UNPREDICTABLE
- Patterns emerge in the LONG RUN

Run with: manim -qm --format=mp4 l01_random_process.py RandomProcessDefinition
"""
from manim import *
import random


class RandomProcessDefinition(Scene):
    def construct(self):
        # Set random seed for reproducibility
        random.seed(42)

        # ========== PART 1: TITLE ==========
        title = Text("What is a Random Process?", font_size=44, color=BLUE)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # ========== PART 2: KNOWN OUTCOMES ==========
        # Show a coin with known outcomes
        coin_label = Text("A Coin Flip", font_size=32, color=BLUE)
        coin_label.shift(UP * 1.5)
        self.play(Write(coin_label))
        self.wait(0.3)

        # Create coin representation (circle with H/T)
        coin = Circle(radius=0.8, color=YELLOW, fill_opacity=0.3, stroke_width=4)
        coin.shift(LEFT * 3 + UP * 0.2)

        coin_text = Text("H", font_size=48, color=YELLOW)
        coin_text.move_to(coin.get_center())

        coin_group = VGroup(coin, coin_text)
        self.play(FadeIn(coin_group))
        self.wait(0.3)

        # List known outcomes
        known_label = Text("1. Known Outcomes:", font_size=28, color=BLUE)
        known_label.next_to(coin, RIGHT, buff=1.5)
        known_label.shift(UP * 0.5)
        self.play(Write(known_label))

        outcomes_box = VGroup(
            Text("H", font_size=32, color=YELLOW),
            Text("or", font_size=24),
            Text("T", font_size=32, color=YELLOW),
        ).arrange(RIGHT, buff=0.3)
        outcomes_box.next_to(known_label, DOWN, buff=0.3)
        outcomes_box.shift(RIGHT * 0.2)
        self.play(Write(outcomes_box))
        self.wait(0.5)

        # Highlight known outcomes
        known_highlight = SurroundingRectangle(
            VGroup(known_label, outcomes_box),
            color=BLUE,
            buff=0.2,
            corner_radius=0.1
        )
        self.play(Create(known_highlight))
        self.wait(0.5)

        # ========== PART 3: UNPREDICTABLE RESULTS ==========
        # Fade out Part 2
        self.play(
            FadeOut(coin_label),
            FadeOut(coin_group),
            FadeOut(known_label),
            FadeOut(outcomes_box),
            FadeOut(known_highlight)
        )

        # Show unpredictability
        unpredictable_label = Text("2. Unpredictable Results:", font_size=28, color=BLUE)
        unpredictable_label.to_edge(LEFT, buff=0.5)
        unpredictable_label.shift(UP * 1.2)
        self.play(Write(unpredictable_label))
        self.wait(0.3)

        # Show several random flips
        flip_results = ["H", "T", "H", "H", "T"]
        flip_positions = [LEFT * 4.5, LEFT * 2.5, LEFT * 0.5, RIGHT * 1.5, RIGHT * 3.5]

        question_marks = VGroup()
        for pos in flip_positions:
            q = Text("?", font_size=36, color=GRAY)
            q.move_to(pos + UP * 0.2)
            question_marks.add(q)

        self.play(Write(question_marks))
        self.wait(0.3)

        # Animate flips one by one
        flip_texts = VGroup()
        for i, (result, pos) in enumerate(zip(flip_results, flip_positions)):
            color = YELLOW if result == "H" else BLUE
            flip_text = Text(result, font_size=36, color=color, weight=BOLD)
            flip_text.move_to(pos + UP * 0.2)
            flip_texts.add(flip_text)

            self.play(
                Transform(question_marks[i], flip_text),
                run_time=0.3
            )
            self.wait(0.2)

        # Add question: "Can you predict the next one?"
        predict_question = Text(
            "Can you predict the next?",
            font_size=24,
            color=RED,
            slant=ITALIC
        )
        predict_question.next_to(question_marks, DOWN, buff=0.5)
        self.play(Write(predict_question))
        self.wait(0.5)

        # ========== PART 4: LONG-RUN PATTERN ==========
        # Clear for long-run demonstration
        self.play(
            FadeOut(unpredictable_label),
            FadeOut(question_marks),
            FadeOut(predict_question)
        )

        longrun_label = Text("3. Patterns in the Long Run:", font_size=28, color=BLUE)
        longrun_label.to_edge(LEFT, buff=0.5)
        longrun_label.shift(UP * 1.8)
        self.play(Write(longrun_label))
        self.wait(0.3)

        # Create tally system
        tally_title = Text("100 Coin Flips:", font_size=24)
        tally_title.next_to(longrun_label, DOWN, buff=0.4)
        tally_title.to_edge(LEFT, buff=0.5)
        self.play(Write(tally_title))

        # Tally counters
        heads_label = Text("Heads:", font_size=22, color=YELLOW)
        heads_label.next_to(tally_title, DOWN, buff=0.3)
        heads_label.to_edge(LEFT, buff=0.8)

        tails_label = Text("Tails:", font_size=22, color=BLUE)
        tails_label.next_to(heads_label, DOWN, buff=0.2)

        # Generate 100 flips
        num_flips = 100
        flips = [random.choice(["H", "T"]) for _ in range(num_flips)]
        heads_count = flips.count("H")
        tails_count = flips.count("T")

        heads_counter = Integer(0, color=YELLOW, font_size=32)
        heads_counter.next_to(heads_label, RIGHT, buff=0.3)

        tails_counter = Integer(0, color=BLUE, font_size=32)
        tails_counter.next_to(tails_label, RIGHT, buff=0.3)

        self.play(Write(heads_label), Write(tails_label))
        self.play(Write(heads_counter), Write(tails_counter))
        self.wait(0.3)

        # Animate counting up
        self.play(
            heads_counter.animate.set_value(heads_count),
            tails_counter.animate.set_value(tails_count),
            run_time=2
        )
        self.wait(0.5)

        # Show proportions
        heads_proportion = MathTex(
            rf"\frac{{{heads_count}}}{{100}} = {heads_count/100:.2f}",
            font_size=28,
            color=YELLOW
        )
        heads_proportion.next_to(heads_counter, RIGHT, buff=0.5)

        tails_proportion = MathTex(
            rf"\frac{{{tails_count}}}{{100}} = {tails_count/100:.2f}",
            font_size=28,
            color=BLUE
        )
        tails_proportion.next_to(tails_counter, RIGHT, buff=0.5)

        self.play(Write(heads_proportion), Write(tails_proportion))
        self.wait(0.5)

        # Show approximately 50/50 pattern
        pattern_text = Text(
            "≈ 50% each!",
            font_size=28,
            color=GREEN,
            weight=BOLD
        )
        pattern_text.next_to(tails_proportion, DOWN, buff=0.5)
        pattern_text.shift(LEFT * 1)
        self.play(Write(pattern_text))

        pattern_box = SurroundingRectangle(pattern_text, color=GREEN, buff=0.15)
        self.play(Create(pattern_box))
        self.wait(0.5)

        # ========== PART 5: KEY INSIGHT ==========
        # Clear most elements
        self.play(
            FadeOut(longrun_label),
            FadeOut(tally_title),
            FadeOut(heads_label),
            FadeOut(tails_label),
            FadeOut(heads_counter),
            FadeOut(tails_counter),
            FadeOut(heads_proportion),
            FadeOut(tails_proportion),
            FadeOut(pattern_text),
            FadeOut(pattern_box)
        )

        # Move title to make room
        self.play(title.animate.scale(0.8).to_edge(UP, buff=0.2))

        # Create key insight box
        insight_title = Text("Key Insight:", font_size=32, color=GREEN, weight=BOLD)
        insight_title.shift(UP * 1.2)
        self.play(Write(insight_title))
        self.wait(0.3)

        # Three components
        component1 = VGroup(
            Text("Known", font_size=28, color=BLUE, weight=BOLD),
            Text("outcomes", font_size=24),
        ).arrange(DOWN, buff=0.1)

        component2 = VGroup(
            Text("Unpredictable", font_size=28, color=YELLOW, weight=BOLD),
            Text("results", font_size=24),
        ).arrange(DOWN, buff=0.1)

        component3 = VGroup(
            Text("Long-run", font_size=28, color=GREEN, weight=BOLD),
            Text("patterns", font_size=24),
        ).arrange(DOWN, buff=0.1)

        components = VGroup(component1, component2, component3)
        components.arrange(RIGHT, buff=1.2)
        components.next_to(insight_title, DOWN, buff=0.5)

        # Add plus signs
        plus1 = MathTex("+", font_size=36)
        plus1.move_to((component1.get_right() + component2.get_left()) / 2)

        plus2 = MathTex("+", font_size=36)
        plus2.move_to((component2.get_right() + component3.get_left()) / 2)

        self.play(Write(component1))
        self.wait(0.2)
        self.play(Write(plus1))
        self.play(Write(component2))
        self.wait(0.2)
        self.play(Write(plus2))
        self.play(Write(component3))
        self.wait(0.5)

        # Equals Random Process
        equals = MathTex("=", font_size=40)
        equals.next_to(components, DOWN, buff=0.5)

        random_process = Text(
            "Random Process",
            font_size=36,
            color=BLUE,
            weight=BOLD,
            slant=ITALIC
        )
        random_process.next_to(equals, DOWN, buff=0.3)

        self.play(Write(equals))
        self.play(Write(random_process))
        self.wait(0.5)

        # Final box around everything
        final_box = SurroundingRectangle(
            VGroup(insight_title, components, plus1, plus2, equals, random_process),
            color=BLUE,
            buff=0.3,
            corner_radius=0.15,
            stroke_width=3
        )
        self.play(Create(final_box))
        self.wait(1.5)
