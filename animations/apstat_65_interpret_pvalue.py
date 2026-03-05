"""
Interpret the p-Value (AP Stats Unit 6, Topic 6.5)

Teaches students how to correctly interpret a p-value in context.
Shows the template with required elements: assume H0 true, probability,
"or more extreme", "by chance alone", and context. Highlights the
common misconception that the p-value is the probability H0 is true.

Run with: manim -qm --format=mp4 apstat_65_interpret_pvalue.py InterpretPValue
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class InterpretPValue(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Interpreting the p-Value", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "What does this number actually mean?",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== CORE DEFINITION ==========
        defn = Text(
            "A p-value measures how likely it is to get\n"
            "evidence for H\u2090 as strong as or stronger than\n"
            "the observed evidence, by chance alone,\n"
            "when H\u2080 is true.",
            font_size=24, color=WHITE, line_spacing=1.3,
        )
        defn.next_to(title, DOWN, buff=0.3)

        self.play(Write(defn), run_time=0.8)
        self.wait(0.8)
        self.play(FadeOut(defn), run_time=0.3)

        # ========== TEMPLATE WITH COLOR-CODED ELEMENTS ==========
        template_label = Text(
            "5 Required Elements:", font_size=26, color=WHITE, weight=BOLD,
        )
        template_label.next_to(title, DOWN, buff=0.3).align_to(LEFT * 5.5, LEFT)
        self.play(Write(template_label), run_time=0.3)

        elements = [
            ("1. Assume H\u2080 is true", TEAL_3B1B,
             '"Assuming that 50% of all students\n would choose the green cup..."'),
            ("2. The probability", YELLOW_3B1B,
             '"...there is a 0.1357 probability..."'),
            ("3. Sample result or more extreme", ORANGE_3B1B,
             '"...of getting a sample proportion\n of 0.60 or greater..."'),
            ("4. By chance alone", GREEN_3B1B,
             '"...by chance alone..."'),
            ("5. Context (sample, population)", BLUE_3B1B,
             '"...in a random sample of 30\n students from this school."'),
        ]

        element_groups = []
        for i, (label, color, example) in enumerate(elements):
            label_text = Text(label, font_size=20, color=color, weight=BOLD)
            example_text = Text(example, font_size=16, color=GREY_B, line_spacing=1.1)
            pair = VGroup(label_text, example_text).arrange(RIGHT, buff=0.3, aligned_edge=UP)
            element_groups.append(pair)

        all_elements = VGroup(*element_groups).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        all_elements.next_to(template_label, DOWN, buff=0.2)

        if all_elements.height > 4.0:
            all_elements.scale_to_fit_height(4.0)

        for group in element_groups:
            self.play(FadeIn(group, shift=RIGHT * 0.3), run_time=0.4)
            self.wait(0.2)

        self.wait(0.8)

        # ========== TRANSITION ==========
        self.play(
            FadeOut(VGroup(template_label, all_elements)),
            run_time=0.4,
        )

        # ========== COMMON MISCONCEPTION ==========
        mis_label = Text(
            "Common Misconception", font_size=28, color=RED_3B1B, weight=BOLD,
        )
        mis_label.next_to(title, DOWN, buff=0.3)
        self.play(Write(mis_label), run_time=0.3)

        wrong_text = Text(
            '"The p-value is the probability\n that H\u2080 is true."',
            font_size=26, color=RED_3B1B,
        )
        wrong_text.next_to(mis_label, DOWN, buff=0.3)
        self.play(Write(wrong_text), run_time=0.5)

        cross = Cross(wrong_text, stroke_color=RED_3B1B, stroke_width=6)
        self.play(Create(cross), run_time=0.4)
        self.wait(0.3)

        correct_text = Text(
            "The p-value is calculated\n"
            "ASSUMING H\u2080 is true.\n"
            "It is NOT the probability OF H\u2080.",
            font_size=22, color=GREEN_3B1B, line_spacing=1.3,
        )
        correct_text.next_to(wrong_text, DOWN, buff=0.4)
        correct_box = SurroundingRectangle(
            correct_text, color=GREEN_3B1B, buff=0.15, corner_radius=0.1,
        )
        self.play(Write(correct_text), Create(correct_box), run_time=0.6)
        self.wait(0.5)

        # ========== TRANSITION ==========
        self.play(
            FadeOut(VGroup(mis_label, wrong_text, cross, correct_text, correct_box)),
            run_time=0.4,
        )

        # ========== WORKED EXAMPLE ==========
        ex_label = Text("Full Interpretation:", font_size=24, color=ORANGE_3B1B, weight=BOLD)
        ex_label.next_to(title, DOWN, buff=0.3).align_to(LEFT * 5.5, LEFT)
        self.play(Write(ex_label), run_time=0.3)

        # Color-code the interpretation
        interp_parts = [
            ("Assuming that 50% of all students at this\nschool would choose the green cup,", TEAL_3B1B),
            ("there is a 0.1357 probability", YELLOW_3B1B),
            ("of getting a\nsample proportion of 0.60 or greater", ORANGE_3B1B),
            ("by chance\nalone", GREEN_3B1B),
            ("in a random sample of 30 students.", BLUE_3B1B),
        ]

        interp_groups = []
        for text, color in interp_parts:
            t = Text(text, font_size=20, color=color, line_spacing=1.2)
            interp_groups.append(t)

        full_interp = VGroup(*interp_groups).arrange(DOWN, buff=0.06, aligned_edge=LEFT)
        full_interp.next_to(ex_label, DOWN, buff=0.2)

        if full_interp.height > 3.5:
            full_interp.scale_to_fit_height(3.5)

        for part in interp_groups:
            self.play(Write(part), run_time=0.5)
            self.wait(0.2)

        self.wait(0.5)

        # ========== CLOSING ==========
        closing = Text(
            "Include ALL 5 elements for full credit!",
            font_size=22, color=TEAL_3B1B, weight=BOLD,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(
            closing, color=TEAL_3B1B, buff=0.12, corner_radius=0.1,
        )
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
