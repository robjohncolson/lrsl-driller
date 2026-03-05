"""
Check Conditions for a One-Sample z-Test (AP Stats Unit 6, Topic 6.4)

Shows the three conditions for a z-test: Random, 10% rule, Large Counts.
Key distinction: test conditions use p0 (null value), NOT p-hat.
Side-by-side comparison of CI conditions vs test conditions.
Worked example: n=30, p0=0.5.

Run with: manim -qm --format=mp4 apstat_64_test_conditions.py TestConditionsCheck
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class TestConditionsCheck(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Conditions for a z-Test", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "One-sample z-test for a population proportion",
            font_size=24, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== CONDITION 1: RANDOM ==========
        c1_header = Text("1. Random", font_size=28, color=BLUE_3B1B, weight=BOLD)
        c1_header.next_to(subtitle, DOWN, buff=0.4).align_to(LEFT * 5, LEFT)

        c1_desc = Text(
            "Data collected from a random sample\nor randomized experiment.",
            font_size=20, line_spacing=1.2,
        )
        c1_desc.next_to(c1_header, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(c1_header), run_time=0.4)
        self.play(Write(c1_desc), run_time=0.4)
        self.wait(0.3)

        # ========== CONDITION 2: 10% ==========
        c2_header = Text("2. 10% Condition", font_size=28, color=BLUE_3B1B, weight=BOLD)
        c2_header.next_to(c1_desc, DOWN, buff=0.3, aligned_edge=LEFT)

        c2_formula = Text(
            "n \u2264 10% of N", font_size=26, weight=BOLD,
        )
        c2_formula.next_to(c2_header, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(c2_header), run_time=0.4)
        self.play(Write(c2_formula), run_time=0.4)
        self.wait(0.3)

        # ========== CONDITION 3: LARGE COUNTS ==========
        c3_header = Text("3. Large Counts", font_size=28, color=BLUE_3B1B, weight=BOLD)
        c3_header.next_to(c2_formula, DOWN, buff=0.3, aligned_edge=LEFT)

        c3_formula = Text(
            "np\u2080 \u2265 10   AND   n(1\u2212p\u2080) \u2265 10",
            font_size=26, weight=BOLD,
        )
        c3_formula.next_to(c3_header, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(c3_header), run_time=0.4)
        self.play(Write(c3_formula), run_time=0.5)
        self.wait(0.3)

        # p0 emphasis
        p0_note = Text(
            "Uses p\u2080 (null value), NOT p\u0302!",
            font_size=20, color=GREEN_3B1B, weight=BOLD,
        )
        p0_note.next_to(c3_formula, DOWN, buff=0.15, aligned_edge=LEFT)
        p0_box = SurroundingRectangle(p0_note, color=GREEN_3B1B, buff=0.1, corner_radius=0.08)
        self.play(Write(p0_note), Create(p0_box), run_time=0.5)
        self.wait(0.6)

        # ========== CI vs TEST COMPARISON ==========
        all_conditions = VGroup(
            c1_header, c1_desc, c2_header, c2_formula,
            c3_header, c3_formula, p0_note, p0_box,
        )
        self.play(
            FadeOut(VGroup(all_conditions, subtitle)),
            run_time=0.5,
        )

        comp_title = Text("CI vs. Test: The Key Difference", font_size=28, weight=BOLD)
        comp_title.next_to(title, DOWN, buff=0.35)
        self.play(Write(comp_title), run_time=0.4)

        # CI side
        ci_label = Text("Confidence Interval\n(Topic 6.2)", font_size=20, color=BLUE_3B1B, weight=BOLD)
        ci_label.move_to(LEFT * 3 + UP * 0.2)

        ci_formula = Text(
            "np\u0302 \u2265 10  AND  n(1\u2212p\u0302) \u2265 10",
            font_size=20, color=RED_3B1B, weight=BOLD,
        )
        ci_formula.next_to(ci_label, DOWN, buff=0.2)

        ci_note = Text("Uses p\u0302 (sample)", font_size=18, color=RED_3B1B)
        ci_note.next_to(ci_formula, DOWN, buff=0.1)

        # Test side
        test_label = Text("Significance Test\n(Topic 6.4)", font_size=20, color=YELLOW_3B1B, weight=BOLD)
        test_label.move_to(RIGHT * 3 + UP * 0.2)

        test_formula = Text(
            "np\u2080 \u2265 10  AND  n(1\u2212p\u2080) \u2265 10",
            font_size=20, color=GREEN_3B1B, weight=BOLD,
        )
        test_formula.next_to(test_label, DOWN, buff=0.2)

        test_note = Text("Uses p\u2080 (null value)", font_size=18, color=GREEN_3B1B)
        test_note.next_to(test_formula, DOWN, buff=0.1)

        div = DashedLine(UP * 0.8, DOWN * 0.8, color=GREY_B)

        self.play(
            Write(ci_label), Write(ci_formula), Write(ci_note),
            Write(test_label), Write(test_formula), Write(test_note),
            Create(div),
            run_time=0.8,
        )
        self.wait(0.5)

        why = Text(
            "Why? When testing, we ASSUME H\u2080 is true,\nso we use the null value p\u2080.",
            font_size=20, color=YELLOW_3B1B,
        )
        why.next_to(VGroup(ci_note, test_note), DOWN, buff=0.35)
        why_box = SurroundingRectangle(why, color=YELLOW_3B1B, buff=0.15, corner_radius=0.1)
        self.play(Write(why), Create(why_box), run_time=0.5)
        self.wait(0.6)

        # ========== WORKED EXAMPLE ==========
        self.play(
            FadeOut(VGroup(
                comp_title, ci_label, ci_formula, ci_note,
                test_label, test_formula, test_note, div, why, why_box,
            )),
            run_time=0.5,
        )

        ex_title = Text(
            "Example:  n = 30,  p\u2080 = 0.50",
            font_size=26, color=BLUE_3B1B, weight=BOLD,
        )
        ex_title.next_to(title, DOWN, buff=0.4)
        self.play(Write(ex_title), run_time=0.4)

        # Check np0
        check1_label = Text("Check np\u2080:", font_size=22, color=WHITE)
        check1_label.move_to(LEFT * 3.5 + UP * 0.2)
        check1_calc = Text("30 \u00d7 0.50 = 15", font_size=24)
        check1_calc.next_to(check1_label, DOWN, buff=0.1, aligned_edge=LEFT)
        check1_result = Text("15 \u2265 10   Pass", font_size=22, color=GREEN_3B1B, weight=BOLD)
        check1_result.next_to(check1_calc, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(check1_label), run_time=0.3)
        self.play(Write(check1_calc), run_time=0.4)
        self.play(Write(check1_result), run_time=0.4)
        self.wait(0.3)

        # Check n(1-p0)
        check2_label = Text("Check n(1\u2212p\u2080):", font_size=22, color=WHITE)
        check2_label.move_to(LEFT * 3.5 + DOWN * 0.9)
        check2_calc = Text("30 \u00d7 0.50 = 15", font_size=24)
        check2_calc.next_to(check2_label, DOWN, buff=0.1, aligned_edge=LEFT)
        check2_result = Text("15 \u2265 10   Pass", font_size=22, color=GREEN_3B1B, weight=BOLD)
        check2_result.next_to(check2_calc, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(check2_label), run_time=0.3)
        self.play(Write(check2_calc), run_time=0.4)
        self.play(Write(check2_result), run_time=0.4)
        self.wait(0.3)

        # Conclusion
        conclusion = Text(
            "All conditions met!",
            font_size=28, color=GREEN_3B1B, weight=BOLD,
        )
        conclusion.to_edge(DOWN, buff=0.5)
        concl_box = SurroundingRectangle(
            conclusion, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Write(conclusion), Create(concl_box), run_time=0.5)
        self.wait(1.5)
