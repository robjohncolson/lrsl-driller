"""
Topic 4.9 Capstone Animation

Full real-world problem combining mean and SD rules.
Coffee + Muffin example showing both rules.

To render:
manim -qm --format=mp4 l48_capstone_49.py Capstone49
"""

from manim import *

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

class Capstone49(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # Title
        title = Text("4.9 Capstone: Full Problem", font_size=44, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # Icons and setup
        coffee_icon = Text("Coffee", font_size=36, color=BLUE_3B1B)
        coffee_price = MathTex(r"\mu = \$4.00", font_size=28, color=BLUE_3B1B)
        coffee_sd = MathTex(r"\sigma = \$0.50", font_size=28, color=BLUE_3B1B)

        muffin_icon = Text("Muffin", font_size=36, color=YELLOW_3B1B)
        muffin_price = MathTex(r"\mu = \$3.00", font_size=28, color=YELLOW_3B1B)
        muffin_sd = MathTex(r"\sigma = \$0.75", font_size=28, color=YELLOW_3B1B)

        coffee_group = VGroup(coffee_icon, coffee_price, coffee_sd).arrange(DOWN, buff=0.1)
        muffin_group = VGroup(muffin_icon, muffin_price, muffin_sd).arrange(DOWN, buff=0.1)

        items = VGroup(coffee_group, muffin_group).arrange(RIGHT, buff=2)
        items.shift(UP * 1.5)

        plus = MathTex("+", font_size=48)
        plus.move_to((coffee_group.get_right() + muffin_group.get_left()) / 2)

        self.play(Write(coffee_group), Write(muffin_group), Write(plus))
        self.wait(0.3)

        # Question
        question = Text("Find mean and SD of total cost", font_size=32, color=WHITE)
        question.shift(UP * 0.3)
        self.play(Write(question))
        self.wait(0.5)

        # Part 1: Mean
        part1_header = Text("Part 1: Mean", font_size=32, color=TEAL_3B1B, weight=BOLD)
        part1_header.shift(LEFT * 3.5 + DOWN * 0.5)
        self.play(Write(part1_header))

        mean_calc = MathTex(
            r"\mu", "=", "4.00", "+", "3.00", "=", r"\$7.00",
            font_size=32
        )
        mean_calc[2].set_color(BLUE_3B1B)
        mean_calc[4].set_color(YELLOW_3B1B)
        mean_calc[6].set_color(GREEN)
        mean_calc.next_to(part1_header, DOWN, buff=0.2)

        self.play(Write(mean_calc))

        checkmark1 = MathTex(r"\checkmark", font_size=36, color=GREEN)
        checkmark1.next_to(mean_calc, RIGHT, buff=0.2)
        self.play(Write(checkmark1))

        mean_note = Text("Means add normally", font_size=22, color=TEAL_3B1B)
        mean_note.next_to(mean_calc, DOWN, buff=0.1)
        self.play(Write(mean_note))
        self.wait(0.5)

        # Part 2: SD (The trap!)
        part2_header = Text("Part 2: SD", font_size=32, color=PINK_3B1B, weight=BOLD)
        part2_header.shift(RIGHT * 2.5 + DOWN * 0.5)
        self.play(Write(part2_header))

        # Tempting wrong answer
        wrong_sd = MathTex(
            "0.50", "+", "0.75", "=", "1.25",
            font_size=28, color=RED
        )
        wrong_sd.next_to(part2_header, DOWN, buff=0.2)
        self.play(Write(wrong_sd))

        cross = Cross(wrong_sd, stroke_color=RED, stroke_width=4)
        self.play(Create(cross))
        self.wait(0.3)

        # Correct process
        self.play(
            wrong_sd.animate.shift(LEFT * 0.5),
            cross.animate.shift(LEFT * 0.5)
        )

        correct_label = Text("Correct:", font_size=24, color=GREEN)
        correct_label.next_to(wrong_sd, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(Write(correct_label))

        step1 = MathTex(r"0.50^2 = 0.25", font_size=24)
        step1.next_to(correct_label, DOWN, buff=0.15, aligned_edge=LEFT)
        step1[0][0:4].set_color(BLUE_3B1B)

        step2 = MathTex(r"0.75^2 = 0.5625", font_size=24)
        step2.next_to(step1, DOWN, buff=0.1, aligned_edge=LEFT)
        step2[0][0:4].set_color(YELLOW_3B1B)

        step3 = MathTex(r"0.25 + 0.5625 = 0.8125", font_size=24)
        step3.next_to(step2, DOWN, buff=0.1, aligned_edge=LEFT)

        step4 = MathTex(r"\sqrt{0.8125} \approx \$0.90", font_size=24, color=GREEN)
        step4.next_to(step3, DOWN, buff=0.1, aligned_edge=LEFT)

        for step in [step1, step2, step3, step4]:
            self.play(Write(step), run_time=0.5)

        self.wait(0.5)

        # Final answer box
        final_answer = VGroup(
            MathTex(r"\text{Mean: } \$7.00", font_size=36, color=GREEN),
            MathTex(r"\text{SD: } \$0.90", font_size=36, color=GREEN)
        ).arrange(RIGHT, buff=1)
        final_answer.to_edge(DOWN, buff=1)

        answer_box = SurroundingRectangle(
            final_answer, color=GREEN, buff=0.2, corner_radius=0.1
        )

        self.play(Write(final_answer), Create(answer_box))
        self.wait(0.5)

        # Recap formulas
        self.play(
            FadeOut(coffee_group), FadeOut(muffin_group), FadeOut(plus),
            FadeOut(question),
            FadeOut(part1_header), FadeOut(mean_calc), FadeOut(checkmark1), FadeOut(mean_note),
            FadeOut(part2_header), FadeOut(wrong_sd), FadeOut(cross),
            FadeOut(correct_label), FadeOut(step1), FadeOut(step2), FadeOut(step3), FadeOut(step4)
        )

        recap_title = Text("Key Formulas", font_size=36, color=WHITE, weight=BOLD)
        recap_title.shift(UP * 1.5)
        self.play(Write(recap_title))

        formula1 = MathTex(
            r"\mu_{X+Y} = \mu_X + \mu_Y",
            font_size=40
        )
        formula1.shift(UP * 0.5)

        formula2 = MathTex(
            r"\sigma_{X+Y} = \sqrt{\sigma_X^2 + \sigma_Y^2}",
            font_size=40
        )
        formula2.next_to(formula1, DOWN, buff=0.4)

        box1 = SurroundingRectangle(formula1, color=TEAL_3B1B, buff=0.15, corner_radius=0.1)
        box2 = SurroundingRectangle(formula2, color=PINK_3B1B, buff=0.15, corner_radius=0.1)

        self.play(Write(formula1), Create(box1))
        self.play(Write(formula2), Create(box2))

        self.wait(2)
