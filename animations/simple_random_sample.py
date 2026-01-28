"""
Simple Random Sample (SRS) Definition
Clarifies the KEY distinction: NOT just "every individual has equal chance"
BUT "every GROUP of size n has equal chance of being selected"

Run with: manim -qm --format=mp4 simple_random_sample.py SimpleRandomSampleDefinition
"""
from manim import *
from itertools import combinations


class SimpleRandomSampleDefinition(Scene):
    def construct(self):
        # Title
        title = Text("What Makes a Sample 'Simple Random'?", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # ========== PART 1: Common Misconception ==========
        misconception_title = Text("Common Misconception", font_size=32, color=YELLOW)
        misconception_title.next_to(title, DOWN, buff=0.4)
        self.play(Write(misconception_title))

        wrong_def = MathTex(
            r"\text{``Every individual has an equal chance of being selected''}",
            font_size=28
        )
        wrong_def.next_to(misconception_title, DOWN, buff=0.3)
        self.play(Write(wrong_def))
        self.wait(0.5)

        # Cross it out
        cross = Cross(wrong_def, color=RED, stroke_width=4)
        self.play(Create(cross))

        not_enough = Text("This is NOT enough!", font_size=24, color=RED)
        not_enough.next_to(wrong_def, DOWN, buff=0.2)
        self.play(Write(not_enough))
        self.wait(1)

        # Clear misconception section
        self.play(
            FadeOut(misconception_title),
            FadeOut(wrong_def),
            FadeOut(cross),
            FadeOut(not_enough)
        )

        # ========== PART 2: Show Population ==========
        pop_label = Text("Population of 6 people:", font_size=28)
        pop_label.next_to(title, DOWN, buff=0.5)
        self.play(Write(pop_label))

        # Create 6 dots representing people (labeled A-F)
        people = VGroup()
        labels = ["A", "B", "C", "D", "E", "F"]
        colors = [BLUE] * 6

        for i, label in enumerate(labels):
            dot = Dot(radius=0.25, color=BLUE, fill_opacity=0.8)
            dot.shift(LEFT * 2.5 + RIGHT * i * 1.0)
            text = Text(label, font_size=20, color=WHITE)
            text.move_to(dot.get_center())
            person = VGroup(dot, text)
            people.add(person)

        people.next_to(pop_label, DOWN, buff=0.5)
        self.play(LaggedStart(*[FadeIn(p, scale=0.5) for p in people], lag_ratio=0.1))
        self.wait(0.5)

        # ========== PART 3: Show All Possible Samples of Size 3 ==========
        sample_title = Text("All possible samples of size n=3:", font_size=26)
        sample_title.next_to(people, DOWN, buff=0.6)
        self.play(Write(sample_title))

        # Calculate all combinations
        all_combos = list(combinations(labels, 3))
        total_combos = len(all_combos)  # Should be 20

        # Show count
        count_text = MathTex(
            r"\binom{6}{3} = " + str(total_combos) + r"\text{ possible samples}",
            font_size=26
        )
        count_text.next_to(sample_title, DOWN, buff=0.3)
        self.play(Write(count_text))
        self.wait(0.5)

        # Show first few combinations in a grid
        combo_display = VGroup()
        display_combos = all_combos[:10]  # Show first 10

        for i, combo in enumerate(display_combos):
            combo_text = Text(f"{{{combo[0]}, {combo[1]}, {combo[2]}}}", font_size=18, color=GREEN)
            combo_display.add(combo_text)

        # Arrange in 2 rows of 5
        row1 = VGroup(*combo_display[:5]).arrange(RIGHT, buff=0.4)
        row2 = VGroup(*combo_display[5:]).arrange(RIGHT, buff=0.4)
        all_combos_display = VGroup(row1, row2).arrange(DOWN, buff=0.2)
        all_combos_display.next_to(count_text, DOWN, buff=0.3)

        ellipsis = Text("... and 10 more", font_size=18, color=GREEN)
        ellipsis.next_to(all_combos_display, DOWN, buff=0.15)

        self.play(
            LaggedStart(*[FadeIn(c, scale=0.8) for c in combo_display], lag_ratio=0.05)
        )
        self.play(Write(ellipsis))
        self.wait(0.5)

        # ========== PART 4: Key Point - Equal Probability ==========
        # Highlight that EACH combination has equal probability
        prob_box = VGroup()
        prob_text = MathTex(
            r"P(\{A,B,C\}) = P(\{A,B,D\}) = \cdots = P(\{D,E,F\}) = \frac{1}{20}",
            font_size=24,
            color=YELLOW
        )
        prob_text.next_to(ellipsis, DOWN, buff=0.4)

        self.play(Write(prob_text))
        self.wait(0.5)

        # Highlight a few combinations on the population
        highlight_combos = [("A", "B", "C"), ("B", "D", "F"), ("D", "E", "F")]

        for combo in highlight_combos:
            # Highlight the selected people
            highlights = []
            for person in people:
                label = person[1].text
                if label in combo:
                    highlights.append(person[0].animate.set_color(GREEN))

            self.play(*highlights, run_time=0.4)
            self.wait(0.3)

            # Reset colors
            reset = [person[0].animate.set_color(BLUE) for person in people]
            self.play(*reset, run_time=0.3)

        self.wait(0.5)

        # ========== PART 5: Counter-Example ==========
        # Clear middle section
        self.play(
            FadeOut(sample_title),
            FadeOut(count_text),
            FadeOut(all_combos_display),
            FadeOut(ellipsis),
            FadeOut(prob_text)
        )

        counter_title = Text("Counter-Example: NOT an SRS", font_size=28, color=RED)
        counter_title.next_to(people, DOWN, buff=0.5)
        self.play(Write(counter_title))

        counter_desc = Text(
            '"Always pick the first 3 people in the list"',
            font_size=22
        )
        counter_desc.next_to(counter_title, DOWN, buff=0.3)
        self.play(Write(counter_desc))

        # Highlight A, B, C
        for i in range(3):
            self.play(people[i][0].animate.set_color(RED), run_time=0.3)

        self.wait(0.5)

        # Show why this fails
        fail_reason = VGroup(
            MathTex(r"P(\{A,B,C\}) = 1", font_size=24, color=RED),
            MathTex(r"P(\{D,E,F\}) = 0", font_size=24, color=RED),
        ).arrange(DOWN, buff=0.2)
        fail_reason.next_to(counter_desc, DOWN, buff=0.4)
        self.play(Write(fail_reason))

        not_equal = Text("Not equal! This is NOT an SRS.", font_size=22, color=RED)
        not_equal.next_to(fail_reason, DOWN, buff=0.3)
        self.play(Write(not_equal))
        self.wait(1)

        # Reset people colors
        self.play(*[person[0].animate.set_color(BLUE) for person in people])

        # ========== PART 6: Final Definition ==========
        # Clear and show boxed definition
        self.play(
            FadeOut(pop_label),
            FadeOut(people),
            FadeOut(counter_title),
            FadeOut(counter_desc),
            FadeOut(fail_reason),
            FadeOut(not_equal)
        )

        # Final correct definition
        definition_title = Text("The Correct Definition:", font_size=32, color=GREEN)
        definition_title.next_to(title, DOWN, buff=0.6)
        self.play(Write(definition_title))

        definition = VGroup(
            Text("A Simple Random Sample (SRS) of size n is chosen", font_size=26),
            Text("such that EVERY possible group of n individuals", font_size=26, color=YELLOW),
            Text("has an EQUAL chance of being selected.", font_size=26, color=YELLOW),
        ).arrange(DOWN, buff=0.15)
        definition.next_to(definition_title, DOWN, buff=0.4)

        self.play(Write(definition[0]))
        self.play(Write(definition[1]))
        self.play(Write(definition[2]))
        self.wait(0.5)

        # Box the definition
        box = SurroundingRectangle(definition, color=GREEN, buff=0.25, corner_radius=0.1)
        self.play(Create(box))
        self.wait(0.5)

        # Key insight at bottom
        insight = MathTex(
            r"\text{Key: Focus on } \textbf{groups} \text{, not just individuals!}",
            font_size=28
        )
        insight.to_edge(DOWN, buff=0.6)
        self.play(Write(insight))
        self.wait(2)


class SRSvsSystematic(Scene):
    """Bonus scene: Shows why systematic sampling is not SRS even though
    every individual has equal probability"""
    def construct(self):
        title = Text("Why Systematic Sampling is NOT SRS", font_size=36)
        title.to_edge(UP)
        self.play(Write(title))

        # Show population of 9 people in a grid
        subtitle = Text("Population: 9 people, Sample size: 3", font_size=24)
        subtitle.next_to(title, DOWN, buff=0.3)
        self.play(Write(subtitle))

        # Create 9 dots in a row
        people = VGroup()
        for i in range(9):
            dot = Dot(radius=0.25, color=BLUE, fill_opacity=0.8)
            label = Text(str(i + 1), font_size=18, color=WHITE)
            dot.shift(LEFT * 4 + RIGHT * i * 1.0)
            label.move_to(dot.get_center())
            people.add(VGroup(dot, label))

        people.center()
        people.shift(UP * 0.5)
        self.play(LaggedStart(*[FadeIn(p) for p in people], lag_ratio=0.05))
        self.wait(0.5)

        # Systematic sampling: pick every 3rd person
        sys_label = Text("Systematic: Pick every 3rd person", font_size=24)
        sys_label.next_to(people, DOWN, buff=0.5)
        self.play(Write(sys_label))

        # Show the 3 possible systematic samples
        samples_text = VGroup(
            Text("Start at 1: {1, 4, 7}", font_size=22, color=GREEN),
            Text("Start at 2: {2, 5, 8}", font_size=22, color=YELLOW),
            Text("Start at 3: {3, 6, 9}", font_size=22, color=RED),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        samples_text.next_to(sys_label, DOWN, buff=0.4)

        # Animate each systematic sample
        sample_indices = [[0, 3, 6], [1, 4, 7], [2, 5, 8]]
        sample_colors = [GREEN, YELLOW, RED]

        for idx, (indices, color, text) in enumerate(zip(sample_indices, sample_colors, samples_text)):
            self.play(Write(text))
            for i in indices:
                self.play(people[i][0].animate.set_color(color), run_time=0.2)
            self.wait(0.3)
            for i in indices:
                self.play(people[i][0].animate.set_color(BLUE), run_time=0.1)

        self.wait(0.5)

        # Show the problem
        problem = VGroup(
            Text("Each PERSON has equal chance (1/3)", font_size=22),
            Text("But only 3 possible SAMPLES out of", font_size=22),
            MathTex(r"\binom{9}{3} = 84 \text{ possible groups}", font_size=24),
        ).arrange(DOWN, buff=0.15)
        problem.next_to(samples_text, DOWN, buff=0.4)

        self.play(Write(problem[0]))
        self.play(Write(problem[1]))
        self.play(Write(problem[2]))
        self.wait(0.5)

        # Impossible sample
        impossible = MathTex(
            r"P(\{1, 2, 3\}) = 0 \neq \frac{1}{84}",
            font_size=26,
            color=RED
        )
        impossible.next_to(problem, DOWN, buff=0.3)
        self.play(Write(impossible))

        conclusion = Text("Systematic sampling is NOT an SRS!", font_size=26, color=RED)
        conclusion.to_edge(DOWN, buff=0.5)
        box = SurroundingRectangle(conclusion, color=RED, buff=0.15)

        self.play(Write(conclusion), Create(box))
        self.wait(2)
