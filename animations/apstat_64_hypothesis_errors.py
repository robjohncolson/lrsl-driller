"""
Common Hypothesis Errors (AP Stats Unit 6, Topic 6.4)

Shows a gallery of common student mistakes when writing hypotheses:
1. Using p-hat instead of p
2. Putting inequality in the null
3. Using equality in the alternative
4. Defining parameter with sample language instead of population language
Each error is shown, crossed out, and corrected.

Run with: manim -qm --format=mp4 apstat_64_hypothesis_errors.py HypothesisErrorMuseum
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"


class HypothesisErrorMuseum(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Common Hypothesis Errors", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Avoid these mistakes on the AP Exam!",
            font_size=24, color=RED_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== ERROR 1: p-hat in hypotheses ==========
        err1_label = Text("Error 1:", font_size=22, color=RED_3B1B, weight=BOLD)
        err1_label.move_to(LEFT * 4 + UP * 0.8)
        self.play(Write(err1_label), run_time=0.3)

        err1_wrong = Text(
            "H\u2080: p\u0302 = 0.50", font_size=30, color=RED_3B1B, weight=BOLD,
        )
        err1_wrong.next_to(err1_label, RIGHT, buff=0.3)
        self.play(Write(err1_wrong), run_time=0.4)

        strike1 = Line(
            err1_wrong.get_left() + LEFT * 0.1,
            err1_wrong.get_right() + RIGHT * 0.1,
            color=RED_3B1B, stroke_width=4,
        )
        self.play(Create(strike1), run_time=0.3)

        err1_right = Text(
            "H\u2080: p = 0.50", font_size=30, color=GREEN_3B1B, weight=BOLD,
        )
        err1_right.next_to(err1_wrong, DOWN, buff=0.15, aligned_edge=LEFT)

        err1_fix = Text("Use p, not p\u0302!", font_size=16, color=GREEN_3B1B)
        err1_fix.next_to(err1_right, RIGHT, buff=0.3)

        self.play(Write(err1_right), Write(err1_fix), run_time=0.5)
        self.wait(0.5)

        # ========== ERROR 2: inequality in null ==========
        err2_label = Text("Error 2:", font_size=22, color=RED_3B1B, weight=BOLD)
        err2_label.move_to(LEFT * 4 + DOWN * 0.2)
        self.play(Write(err2_label), run_time=0.3)

        err2_wrong = Text(
            "H\u2080: p > 0.50", font_size=30, color=RED_3B1B, weight=BOLD,
        )
        err2_wrong.next_to(err2_label, RIGHT, buff=0.3)
        self.play(Write(err2_wrong), run_time=0.4)

        strike2 = Line(
            err2_wrong.get_left() + LEFT * 0.1,
            err2_wrong.get_right() + RIGHT * 0.1,
            color=RED_3B1B, stroke_width=4,
        )
        self.play(Create(strike2), run_time=0.3)

        err2_right = Text(
            "H\u2080: p = 0.50", font_size=30, color=GREEN_3B1B, weight=BOLD,
        )
        err2_right.next_to(err2_wrong, DOWN, buff=0.15, aligned_edge=LEFT)

        err2_fix = Text('Null must use "="', font_size=16, color=GREEN_3B1B)
        err2_fix.next_to(err2_right, RIGHT, buff=0.3)

        self.play(Write(err2_right), Write(err2_fix), run_time=0.5)
        self.wait(0.5)

        # ========== ERROR 3: equality in alternative ==========
        err3_label = Text("Error 3:", font_size=22, color=RED_3B1B, weight=BOLD)
        err3_label.move_to(LEFT * 4 + DOWN * 1.2)
        self.play(Write(err3_label), run_time=0.3)

        err3_wrong = Text(
            "H\u2090: p = 0.60", font_size=30, color=RED_3B1B, weight=BOLD,
        )
        err3_wrong.next_to(err3_label, RIGHT, buff=0.3)
        self.play(Write(err3_wrong), run_time=0.4)

        strike3 = Line(
            err3_wrong.get_left() + LEFT * 0.1,
            err3_wrong.get_right() + RIGHT * 0.1,
            color=RED_3B1B, stroke_width=4,
        )
        self.play(Create(strike3), run_time=0.3)

        err3_right = Text(
            "H\u2090: p > 0.50", font_size=30, color=GREEN_3B1B, weight=BOLD,
        )
        err3_right.next_to(err3_wrong, DOWN, buff=0.15, aligned_edge=LEFT)

        err3_fix = Text("Alt must use <, >, or \u2260", font_size=16, color=GREEN_3B1B)
        err3_fix.next_to(err3_right, RIGHT, buff=0.3)

        self.play(Write(err3_right), Write(err3_fix), run_time=0.5)
        self.wait(0.5)

        # ========== ERROR 4: sample language ==========
        err4_label = Text("Error 4:", font_size=22, color=RED_3B1B, weight=BOLD)
        err4_label.move_to(LEFT * 4 + DOWN * 2.2)
        self.play(Write(err4_label), run_time=0.3)

        err4_wrong = Text(
            '"p = proportion who said yes"',
            font_size=20, color=RED_3B1B,
        )
        err4_wrong.next_to(err4_label, RIGHT, buff=0.3)
        self.play(Write(err4_wrong), run_time=0.4)

        strike4 = Line(
            err4_wrong.get_left() + LEFT * 0.1,
            err4_wrong.get_right() + RIGHT * 0.1,
            color=RED_3B1B, stroke_width=4,
        )
        self.play(Create(strike4), run_time=0.3)

        err4_right = Text(
            '"p = proportion who WOULD say yes"',
            font_size=20, color=GREEN_3B1B,
        )
        err4_right.next_to(err4_wrong, DOWN, buff=0.15, aligned_edge=LEFT)

        err4_fix = Text(
            'Use "would" = population',
            font_size=16, color=GREEN_3B1B,
        )
        err4_fix.next_to(err4_right, RIGHT, buff=0.3)

        self.play(Write(err4_right), Write(err4_fix), run_time=0.5)
        self.wait(0.5)

        # ========== CHECKLIST ==========
        self.play(
            *[FadeOut(mob) for mob in self.mobjects if mob is not title],
            run_time=0.5,
        )

        check_title = Text("Before submitting, verify:", font_size=28, weight=BOLD, color=TEAL_3B1B)
        check_title.next_to(title, DOWN, buff=0.5)

        items = [
            "Uses p (not p\u0302) in both hypotheses",
            'H\u2080 contains "=" sign',
            "H\u2090 contains strict inequality (<, >, or \u2260)",
            'Parameter defined with "ALL" / "would" (population)',
        ]

        checks = VGroup()
        for item in items:
            check = Text(f"[  ]  {item}", font_size=22, color=WHITE)
            checks.add(check)

        checks.arrange(DOWN, buff=0.25, aligned_edge=LEFT)
        checks.next_to(check_title, DOWN, buff=0.3)

        self.play(Write(check_title), run_time=0.4)
        for c in checks:
            self.play(Write(c), run_time=0.4)
        self.wait(1.5)
